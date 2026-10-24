import { RUNNABLE_PROJECTS, type RunnableProject } from '@kei/shared';
import { Hono } from 'hono';
import { getActiveRunId, getLogs, getRunDetail, listRuns } from '../db';
import type { AppEnv } from '../env';
import { dispatchWorkflow } from '../github';
import { newId, nowIso, sha256Hex, startOfUtcDay } from '../lib';
import { verifyTurnstile } from '../turnstile';

export const publicRoutes = new Hono<AppEnv>();

function isRunnable(project: unknown): project is RunnableProject {
  return typeof project === 'string' && (RUNNABLE_PROJECTS as readonly string[]).includes(project);
}

/** Tombol Run hanya aktif bila semua kunci yang dibutuhkan sudah terpasang. */
function runnerEnabled(env: AppEnv['Bindings']): boolean {
  return Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.GITHUB_TOKEN && env.RUNNER_TOKEN);
}

publicRoutes.get('/config', (c) =>
  c.json({
    runEnabled: runnerEnabled(c.env),
    turnstileSiteKey: c.env.TURNSTILE_SITE_KEY || null,
    projects: RUNNABLE_PROJECTS,
  })
);

publicRoutes.get('/runs', async (c) => {
  const project = c.req.query('project') ?? 'helpmycv';
  const limit = Math.min(Math.max(Number(c.req.query('limit')) || 20, 1), 50);
  return c.json({ runs: await listRuns(c.env.DB, project, limit) });
});

publicRoutes.get('/runs/:id', async (c) => {
  const run = await getRunDetail(c.env.DB, c.req.param('id'));
  return run ? c.json({ run }) : c.json({ error: 'not_found' }, 404);
});

publicRoutes.get('/runs/:id/logs', async (c) => {
  const after = Number(c.req.query('after')) || 0;
  return c.json({ logs: await getLogs(c.env.DB, c.req.param('id'), after) });
});

publicRoutes.post('/runs', async (c) => {
  const body = (await c.req.json().catch(() => null)) as { project?: unknown; turnstileToken?: unknown } | null;
  const project = body?.project;
  if (!isRunnable(project)) return c.json({ error: 'unknown_project' }, 400);
  if (!runnerEnabled(c.env)) return c.json({ error: 'runner_disabled' }, 503);

  // Sudah ada run berjalan: ikut menonton, tidak membuat run baru (PRD §4.2).
  const active = await getActiveRunId(c.env.DB, project);
  if (active) return c.json({ runId: active, joined: true });

  const ip = c.req.header('cf-connecting-ip') ?? '';
  const token = typeof body?.turnstileToken === 'string' ? body.turnstileToken : '';
  if (!token || !(await verifyTurnstile(c.env.TURNSTILE_SECRET_KEY!, token, ip))) {
    return c.json({ error: 'turnstile_failed' }, 403);
  }

  // IP hanya disimpan sebagai hash (PRD SEC-05).
  const requesterHash = await sha256Hex(`${c.env.IP_HASH_SALT ?? ''}:${ip}`);
  const today = startOfUtcDay();
  const [perIp, perDay] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT COUNT(*) AS n FROM runs WHERE requester_hash = ? AND trigger = 'visitor' AND created_at >= ?").bind(requesterHash, today),
    c.env.DB.prepare("SELECT COUNT(*) AS n FROM runs WHERE trigger = 'visitor' AND created_at >= ?").bind(today),
  ]);
  if (((perIp.results[0] as { n: number }).n ?? 0) >= Number(c.env.MAX_RUNS_PER_IP_PER_DAY)) {
    return c.json({ error: 'quota_ip' }, 429);
  }
  if (((perDay.results[0] as { n: number }).n ?? 0) >= Number(c.env.MAX_PUBLIC_RUNS_PER_DAY)) {
    return c.json({ error: 'quota_daily' }, 429);
  }

  const runId = newId();
  try {
    await c.env.DB.prepare(
      "INSERT INTO runs (id, project, trigger, status, created_at, requester_hash) VALUES (?, ?, 'visitor', 'queued', ?, ?)"
    )
      .bind(runId, project, nowIso(), requesterHash)
      .run();
  } catch {
    // Unique index satu-run-aktif: request lain baru saja membuat run.
    const raced = await getActiveRunId(c.env.DB, project);
    if (raced) return c.json({ runId: raced, joined: true });
    throw new Error('failed to create run');
  }

  try {
    await dispatchWorkflow(c.env, project, runId);
  } catch (err) {
    console.error((err as Error).message);
    // Run tidak pernah dimulai: hapus supaya tidak mengotori riwayat dan tidak memakan kuota pengunjung.
    await c.env.DB.prepare('DELETE FROM runs WHERE id = ?').bind(runId).run();
    return c.json({ error: 'dispatch_failed' }, 502);
  }

  return c.json({ runId, joined: false }, 201);
});

/** Artifact dari R2. Mendukung Range supaya video bisa di-seek (wajib untuk Safari). */
publicRoutes.get('/artifacts/*', async (c) => {
  const key = c.req.path.replace(/^\/api\/artifacts\//, '');
  if (!/^runs\/[A-Za-z0-9_-]+\/[A-Za-z0-9._\/-]+$/.test(key) || key.includes('..')) {
    return c.json({ error: 'not_found' }, 404);
  }
  const hasRange = c.req.header('range') !== undefined;
  const object = await c.env.ARTIFACTS.get(key, { range: c.req.raw.headers });
  if (!object) return c.json({ error: 'not_found' }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('accept-ranges', 'bytes');
  // Key unik per run dan tidak pernah ditimpa setelah run selesai.
  headers.set('cache-control', 'public, max-age=86400');

  const range = object.range as { offset?: number; length?: number; suffix?: number } | undefined;
  if (hasRange && range) {
    const offset = range.suffix !== undefined ? object.size - range.suffix : (range.offset ?? 0);
    const length = range.suffix ?? range.length ?? object.size - offset;
    headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set('content-length', String(length));
    return new Response(object.body, { status: 206, headers });
  }
  headers.set('content-length', String(object.size));
  return new Response(object.body, { headers });
});
