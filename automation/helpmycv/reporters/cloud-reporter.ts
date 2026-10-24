import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import type { RunnerEvent } from '../../../packages/shared/src/runner';
import { depth, HIDDEN_METHODS, normalizeStatus, SHOWN_CATEGORIES, tcId } from '../utils/report-format';
import { stepsDirName } from '../utils/steps-dir';

/**
 * Kirim hasil run ke backend QA Lab (PRD §8.1, §9) supaya bisa ditonton live
 * dan diputar ulang. Aktif hanya bila BACKEND_URL dan RUNNER_TOKEN ada (di
 * GitHub Actions); lokal, reporter ini diam.
 *
 * Semua hook mendaftarkan tugas ke satu antrean berurutan, jadi event selalu
 * tiba sesuai urutan dan event `step` baru dikirim setelah screenshot-nya ada
 * di R2. Gagal kirim tidak pernah menggagalkan test.
 */

const BACKEND_URL = (process.env.BACKEND_URL || '').replace(/\/$/, '');
const RUNNER_TOKEN = process.env.RUNNER_TOKEN || '';
const PROJECT = 'helpmycv';
const FLUSH_INTERVAL_MS = 1000;
const MAX_BATCH = 100;
// Dibaca langkah terakhir workflow untuk menutup run bila job berhenti di tengah.
export const RUN_ID_FILE = path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'kei-run-id');

function githubRun(): { githubRunId?: number; githubRunUrl?: string } {
  const { GITHUB_RUN_ID, GITHUB_SERVER_URL, GITHUB_REPOSITORY } = process.env;
  if (!GITHUB_RUN_ID || !GITHUB_SERVER_URL || !GITHUB_REPOSITORY) return {};
  return { githubRunId: Number(GITHUB_RUN_ID), githubRunUrl: `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` };
}

/** webm → mp4 (H.264) supaya video jalan di Safari. Tanpa ffmpeg: kirim webm apa adanya. */
function toMp4(input: string): Promise<string | null> {
  const output = input.replace(/\.webm$/, '.mp4');
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', input, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', output]);
    ffmpeg.on('error', () => resolve(null));
    ffmpeg.on('close', (code) => resolve(code === 0 && fs.existsSync(output) ? output : null));
  });
}

class CloudReporter implements Reporter {
  private enabled = Boolean(BACKEND_URL && RUNNER_TOKEN);
  private runId = process.env.RUN_ID || '';
  private queue: Promise<void> = Promise.resolve();
  private pending: RunnerEvent[] = [];
  private timer: NodeJS.Timeout | undefined;
  private suite: Suite | undefined;
  private logSeq = 0;
  private startedAt = 0;
  private stepIndex = new Map<string, number>();
  private claimedShots = new Map<string, Set<string>>();

  printsToStdio(): boolean {
    return false;
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    if (!this.enabled) return;
    this.suite = suite;
    this.startedAt = Date.now();
    this.enqueue(async () => {
      if (!this.runId) await this.createRun();
      if (!this.runId) return;
      fs.writeFileSync(RUN_ID_FILE, this.runId);
      this.push({ type: 'run.started', total: suite.allTests().length, ...githubRun() });
      await this.flush();
    });
    this.timer = setInterval(() => this.enqueue(() => this.flush()), FLUSH_INTERVAL_MS);
  }

  onTestBegin(test: TestCase, result: TestResult): void {
    if (!this.enabled) return;
    const run = result.retry + 1;
    this.push({
      type: 'test.begin',
      testId: this.testId(test, result),
      tcId: tcId(test, run),
      title: test.title,
      file: path.relative(process.cwd(), test.location.file),
    });
    this.log('info', `▶ ${tcId(test, run)} ${test.title}`);
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
    if (!this.enabled) return;
    if (SHOWN_CATEGORIES.has(step.category) && !(step.category === 'pw:api' && HIDDEN_METHODS.some((m) => step.title.includes(m)))) {
      const elapsed = ((Date.now() - this.startedAt) / 1000).toFixed(2);
      const indent = '  '.repeat(Math.max(0, depth(step) - 2));
      const duration = step.duration ? ` (${(step.duration / 1000).toFixed(2)}s)` : '';
      this.log(step.error ? 'error' : 'info', `+${elapsed}s ${indent}${step.error ? '✘' : '✔'} ${step.title.replace(/\s+/g, ' ').trim()}${duration}`);
      if (step.error?.message) this.log('error', `${indent}   ↳ ${step.error.message.split('\n')[0]}`);
    }
    if (step.category !== 'test.step') return;

    const testId = this.testId(test, result);
    const shots = this.claimShots(test, result);
    this.enqueue(async () => {
      // Satu event per screenshot; langkah tanpa screenshot tetap dicatat.
      const files = shots.length ? shots : [null];
      for (const file of files) {
        const index = (this.stepIndex.get(testId) ?? 0) + 1;
        this.stepIndex.set(testId, index);
        const key = file ? await this.upload(`${testId}/step-${String(index).padStart(2, '0')}.png`, file, 'image/png') : undefined;
        this.push({ type: 'step', testId, index, label: step.title, screenshotKey: key });
      }
    });
  }

  onStdOut(chunk: string | Buffer): void {
    if (!this.enabled) return;
    for (const line of chunk.toString().split('\n').filter(Boolean)) this.log('info', line);
  }

  onStdErr(chunk: string | Buffer): void {
    if (!this.enabled) return;
    for (const line of chunk.toString().split('\n').filter(Boolean)) this.log('error', line);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!this.enabled) return;
    const testId = this.testId(test, result);
    const status = normalizeStatus(result.status) as 'passed' | 'failed' | 'skipped';
    const video = result.attachments.find((a) => a.name === 'video' && a.path)?.path;
    const outputDir = test.parent.project()?.outputDir ?? '';
    const network = path.join(outputDir, stepsDirName(test.location.file, test.title), 'network.json');
    this.log(status === 'failed' ? 'error' : 'info', `${status === 'passed' ? '✓' : status === 'failed' ? '✘' : '–'} ${test.title} (${(result.duration / 1000).toFixed(1)}s)`);

    this.enqueue(async () => {
      let videoKey: string | undefined;
      if (video && fs.existsSync(video)) {
        const mp4 = await toMp4(video);
        videoKey = mp4
          ? await this.upload(`${testId}/video.mp4`, mp4, 'video/mp4')
          : await this.upload(`${testId}/video.webm`, video, 'video/webm');
      }
      const networkKey = fs.existsSync(network) ? await this.upload(`${testId}/network.json`, network, 'application/json') : undefined;
      this.push({
        type: 'test.end',
        testId,
        status,
        durationMs: result.duration,
        error: result.error?.message?.split('\n').slice(0, 6).join('\n'),
        videoKey,
        networkKey,
      });
      await this.flush();
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    if (!this.enabled) return;
    clearInterval(this.timer);
    const counts = { passed: 0, failed: 0, skipped: 0 };
    for (const test of this.suite?.allTests() ?? []) {
      const outcome = test.outcome();
      if (outcome === 'expected' || outcome === 'flaky') counts.passed += 1;
      else if (outcome === 'unexpected') counts.failed += 1;
      else counts.skipped += 1;
    }
    const status = result.status === 'passed' ? 'passed' : result.status === 'interrupted' ? 'cancelled' : 'failed';
    this.enqueue(async () => {
      this.push({ type: 'run.finished', status, ...counts, durationMs: Math.round(result.duration) });
      await this.flush();
    });
    await this.queue;
  }

  private testId(test: TestCase, result: TestResult): string {
    return `${test.id}-${result.retry}`;
  }

  private log(level: 'info' | 'error', message: string): void {
    this.logSeq += 1;
    this.push({ type: 'log', seq: this.logSeq, level, message });
  }

  private push(event: RunnerEvent): void {
    this.pending.push(event);
  }

  private enqueue(task: () => Promise<void>): void {
    this.queue = this.queue.then(task).catch((err) => console.error(`[cloud] ${(err as Error).message}`));
  }

  private async request(method: string, url: string, body: BodyInit, contentType: string): Promise<Response | null> {
    try {
      return await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${RUNNER_TOKEN}`, 'Content-Type': contentType },
        body,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      console.error(`[cloud] ${method} ${url.replace(BACKEND_URL, '')} failed: ${(err as Error).message}`);
      return null;
    }
  }

  private async createRun(): Promise<void> {
    const trigger = process.env.RUN_TRIGGER === 'schedule' ? 'schedule' : 'owner';
    const response = await this.request('POST', `${BACKEND_URL}/api/runner/runs`, JSON.stringify({ project: PROJECT, trigger }), 'application/json');
    if (response?.ok) {
      this.runId = ((await response.json()) as { runId: string }).runId;
      return;
    }
    // Mis. 409: run lain sedang aktif. Test tetap jalan, hanya tidak dilaporkan.
    console.error(`[cloud] cannot create run (${response?.status ?? 'network error'}); results will not be reported`);
    this.enabled = false;
    clearInterval(this.timer);
  }

  private async flush(): Promise<void> {
    if (!this.runId) return;
    while (this.pending.length) {
      const events = this.pending.splice(0, MAX_BATCH);
      const response = await this.request('POST', `${BACKEND_URL}/api/runner/events`, JSON.stringify({ runId: this.runId, events }), 'application/json');
      if (!response?.ok) console.error(`[cloud] events rejected (${response?.status ?? 'network error'})`);
    }
  }

  private async upload(name: string, file: string, contentType: string): Promise<string | undefined> {
    const key = `runs/${this.runId}/${name}`;
    const response = await this.request('PUT', `${BACKEND_URL}/api/runner/artifacts/${key}`, fs.readFileSync(file), contentType);
    if (response?.ok) return key;
    console.error(`[cloud] upload ${name} rejected (${response?.status ?? 'network error'})`);
    return undefined;
  }

  /** Sama dengan step-reporter: PNG baru di folder *-steps = screenshot langkah ini. */
  private claimShots(test: TestCase, result: TestResult): string[] {
    const outputDir = test.parent.project()?.outputDir;
    if (!outputDir) return [];
    const dir = path.join(outputDir, stepsDirName(test.location.file, test.title));
    if (!fs.existsSync(dir)) return [];
    const key = this.testId(test, result);
    const claimed = this.claimedShots.get(key) ?? new Set<string>();
    this.claimedShots.set(key, claimed);
    const shots = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.png') && !claimed.has(f))
      .sort();
    shots.forEach((f) => claimed.add(f));
    return shots.map((f) => path.join(dir, f));
  }
}

export default CloudReporter;
