import fs from 'fs';
import path from 'path';
import type { Reporter, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import { stepsDirName } from '../utils/steps-dir';

const SHOWN_CATEGORIES = new Set(['pw:api', 'test.step', 'expect']);
const HIDDEN_METHODS = ['__waitInfo__', '__waitForEventInfo', 'Wait for load state'];

// Baris test (`test(` / `test.skip(` ...) per file, dipakai untuk nomor urut TC.
// Dibaca dari file, bukan dari suite yang terfilter, supaya TC ID tidak berubah
// ketika hanya sebagian test yang dijalankan.
const caseLineCache = new Map<string, number[]>();

function caseLines(file: string): number[] {
  let lines = caseLineCache.get(file);
  if (!lines) {
    lines = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      // Hanya deklarasi test berjudul: test('…'), test.skip('…'), dst. — bukan test.describe/setTimeout/step.
      .flatMap((text, i) => (/^\s*test(\.(only|skip|fixme|fail))?\(\s*[`'"]/.test(text) ? [i + 1] : []));
    caseLineCache.set(file, lines);
  }
  return lines;
}

// Format: <MODUL 3 huruf>-<nomor spec>-<nomor case>, contoh HAR-01-02.
// Run ulang loop (RUN_COUNT > 1) diberi suffix -R2, -R3, dst.
function tcId(test: TestCase, run: number): string {
  const file = test.location.file;
  const moduleCode = path.basename(path.dirname(file)).slice(0, 3).toUpperCase();
  const specNo = path.basename(file).match(/^(\d+)-/)?.[1] ?? '00';
  const caseNo = caseLines(file).indexOf(test.location.line) + 1;
  const runSuffix = run > 1 ? `-R${run}` : '';
  return `${moduleCode}-${specNo}-${String(caseNo).padStart(2, '0')}${runSuffix}`;
}

function normalizeStatus(status: string): string {
  if (status === 'passed') return 'passed';
  if (status === 'failed' || status === 'timedOut' || status === 'interrupted') return 'failed';
  return 'skipped';
}

function depth(step: TestStep): number {
  let level = 1;
  let parent = step.parent;
  while (parent) {
    level += 1;
    parent = parent.parent;
  }
  return level;
}

class StepReporter implements Reporter {
  private startedAt = 0;
  // Screenshot snap() yang sudah dikaitkan ke sebuah step, per test (id + retry).
  private claimedShots = new Map<string, Set<string>>();

  onBegin(): void {
    this.startedAt = Date.now();
  }

  onTestBegin(test: TestCase, result: TestResult): void {
    const location = test.location;
    const relativeFile = path.relative(process.cwd(), location.file);
    const file = `${relativeFile}:${location.line}`;
    const titleParts = test.titlePath().filter(Boolean);
    const project = test.parent?.project()?.name ?? titleParts[0] ?? 'chromium';
    const suite = titleParts
      .filter((p) => p !== project && p !== test.title && !p.endsWith('.spec.ts'))
      .join(' › ');
    const run = result.retry + 1;
    process.stdout.write(
      `[TEST-START] ${file} :: ${project} :: ${suite} :: Run ${run} :: ${test.title}\n`
    );
    process.stdout.write(`[TC] ${tcId(test, run)}\n`);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    process.stdout.write(`[TEST-END] ${normalizeStatus(result.status)} :: ${result.duration}\n`);

    const titleParts = test.titlePath().filter(Boolean);
    const project = test.parent?.project()?.name ?? titleParts[0] ?? 'chromium';
    const suite = titleParts
      .filter((p) => p !== project && p !== test.title && !p.endsWith('.spec.ts'))
      .join(' › ');
    const title = suite ? `${suite} › ${test.title}` : test.title;
    const outputDirs = new Set(
      result.attachments
        .filter((a) => a.path)
        .map((a) => path.basename(path.dirname(a.path as string)))
    );
    // Screenshot step dari snap() ada di folder *-steps tersendiri, bukan attachment.
    outputDirs.add(stepsDirName(test.location.file, test.title));
    for (const dir of outputDirs) {
      process.stdout.write(`[TEST-DIR] ${dir} :: ${title}\n`);
    }
  }

  onStepEnd(_test: TestCase, _result: TestResult, step: TestStep): void {
    if (!SHOWN_CATEGORIES.has(step.category)) return;
    if (step.category === 'pw:api' && HIDDEN_METHODS.some((m) => step.title.includes(m))) return;

    // Acceptance criteria = expect dengan pesan custom yang ditulis di tests/ atau helpers/.
    // expect di pages/ (datepicker, tombol harus terlihat, dst.) dan expect tanpa pesan
    // (Playwright memberi judul `Expect "toBeVisible"`) hanya pengecekan internal.
    let category = step.category;
    const isCriterion = !/^Expect "/.test(step.title) && !step.location?.file.includes(`${path.sep}pages${path.sep}`);
    if (category === 'expect' && !isCriterion) {
      category = 'expect-internal';
    }

    const elapsed = ((Date.now() - this.startedAt) / 1000).toFixed(2);
    const indent = '  '.repeat(Math.max(0, depth(step) - 2));
    const mark = step.error ? '✘' : '✔';
    const duration = step.duration ? ` (${(step.duration / 1000).toFixed(2)}s)` : '';
    const title = step.title.replace(/\s+/g, ' ').trim();

    process.stdout.write(`[STEP] +${elapsed}s ${indent}${mark} [${category}] ${title}${duration}\n`);
    if (step.error?.message) {
      process.stdout.write(`[STEP] ${indent}   ↳ ${step.error.message.split('\n')[0]}\n`);
    }
    if (step.category === 'test.step') {
      const shots = this.claimShots(_test, _result);
      if (shots.length) process.stdout.write(`[STEP-SHOTS] ${shots.join('|')}\n`);
    }
  }

  // Screenshot yang muncul selama step ini berjalan = PNG di folder *-steps yang belum diklaim.
  // onStepEnd step dalam dipanggil sebelum step luarnya, jadi screenshot jatuh ke step terdalam.
  private claimShots(test: TestCase, result: TestResult): string[] {
    const outputDir = test.parent.project()?.outputDir;
    if (!outputDir) return [];
    const dir = path.join(outputDir, stepsDirName(test.location.file, test.title));
    if (!fs.existsSync(dir)) return [];
    const key = `${test.id}-${result.retry}`;
    const claimed = this.claimedShots.get(key) ?? new Set<string>();
    this.claimedShots.set(key, claimed);
    const shots = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.png') && !claimed.has(f))
      .sort();
    shots.forEach((f) => claimed.add(f));
    return shots;
  }
}

export default StepReporter;
