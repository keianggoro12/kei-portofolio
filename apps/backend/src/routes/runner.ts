import { RUNNABLE_PROJECTS, artifactPrefix, type RunnerEvent } from '@kei/shared';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { clip, newId, nowIso, safeEqual } from '../lib';

// Endpoint khusus GitHub Actions (PRD SEC-02). Runner tidak memegang kredensial
// Cloudflare; semua tulis ke D1/R2 lewat sini.
export const runnerRoutes = new Hono<AppEnv>();

const MAX_ARTIFACT_BYTES = 50 * 1024 * 1024;
const MAX_EVENTS_PER_BATCH = 200;

runnerRoutes.use('*', async (c, next) => {
  const expected = c.env.RUNNER_TOKEN;
  const given = c.req.header('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!expected || !safeEqual(given, expected)) return c.json({ error: 'unauthorized' }, 401);
  await next();
});

async function activeRun(db: D1Database, runId: string): Promise<boolean> {
  const row = await db.prepare("SELECT 1 AS ok FROM runs WHERE id = ? AND status IN ('queued', 'running')").bind(runId).first();
  return row !== null;
}

/** Run tanpa tombol (jadwal harian / dispatch manual dari GitHub) mendaftarkan dirinya sendiri. */
runnerRoutes.post('/runs', async (c) => {
  const body = (await c.req.json().catch(() => null)) as { project?: string; trigger?: string } | null;
  if (!body?.project || !(RUNNABLE_PROJECTS as readonly string[]).includes(body.project)) {
    return c.json({ error: 'unknown_project' }, 400);
  }
  const trigger = body.trigger === 'schedule' ? 'schedule' : 'owner';
  const runId = newId();
  try {
    await c.env.DB.prepare("INSERT INTO runs (id, project, trigger, status, created_at) VALUES (?, ?, ?, 'queued', ?)")
      .bind(runId, body.project, trigger, nowIso())
      .run();
  } catch {
    return c.json({ error: 'run_active' }, 409);
  }
  return c.json({ runId }, 201);
});

function statementsFor(db: D1Database, runId: string, event: RunnerEvent, at: string): D1PreparedStatement[] {
  switch (event.type) {
    case 'run.started':
      return [
        db
          .prepare(
            `UPDATE runs SET status = 'running', started_at = COALESCE(started_at, ?),
               github_run_id = COALESCE(?, github_run_id), github_run_url = COALESCE(?, github_run_url),
               total = COALESCE(?, total)
             WHERE id = ? AND status IN ('queued', 'running')`
          )
          .bind(at, event.githubRunId ?? null, clip(event.githubRunUrl, 300), event.total ?? null, runId),
      ];
    case 'test.begin':
      return [
        db
          .prepare(
            `INSERT OR REPLACE INTO test_results (id, run_id, tc_id, title, file, status, started_at)
             VALUES (?, ?, ?, ?, ?, 'running', ?)`
          )
          .bind(clip(event.testId, 120), runId, clip(event.tcId, 40), clip(event.title, 300) ?? 'untitled', clip(event.file, 300), at),
      ];
    case 'step':
      return [
        db
          .prepare('INSERT INTO steps (run_id, test_id, idx, label, screenshot_key, at) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(runId, clip(event.testId, 120), event.index | 0, clip(event.label, 300) ?? '', clip(event.screenshotKey, 300), at),
      ];
    case 'log':
      return [
        db
          .prepare('INSERT INTO run_logs (run_id, seq, level, message, at) VALUES (?, ?, ?, ?, ?)')
          .bind(runId, event.seq | 0, event.level === 'error' ? 'error' : 'info', clip(event.message, 4000) ?? '', at),
      ];
    case 'test.end':
      return [
        db
          .prepare(
            `UPDATE test_results SET status = ?, duration_ms = ?, error = ?, video_key = ?, network_key = ?
             WHERE run_id = ? AND id = ?`
          )
          .bind(
            ['passed', 'failed', 'skipped'].includes(event.status) ? event.status : 'failed',
            event.durationMs | 0,
            clip(event.error, 4000),
            clip(event.videoKey, 300),
            clip(event.networkKey, 300),
            runId,
            clip(event.testId, 120)
          ),
      ];
    case 'run.finished':
      return [
        db
          .prepare(
            `UPDATE runs SET status = ?, passed = ?, failed = ?, skipped = ?, duration_ms = ?, finished_at = ?
             WHERE id = ? AND status IN ('queued', 'running')`
          )
          .bind(
            ['passed', 'failed', 'cancelled'].includes(event.status) ? event.status : 'failed',
            event.passed | 0,
            event.failed | 0,
            event.skipped | 0,
            event.durationMs | 0,
            at,
            runId
          ),
        // Test yang masih "running" saat run berakhir tidak pernah selesai.
        db.prepare("UPDATE test_results SET status = 'failed' WHERE run_id = ? AND status = 'running'").bind(runId),
      ];
    default:
      return [];
  }
}

runnerRoutes.post('/events', async (c) => {
  const body = (await c.req.json().catch(() => null)) as { runId?: string; events?: RunnerEvent[] } | null;
  const runId = body?.runId ?? '';
  const events = Array.isArray(body?.events) ? body.events.slice(0, MAX_EVENTS_PER_BATCH) : [];
  if (!runId || events.length === 0) return c.json({ error: 'invalid_body' }, 400);
  // Run yang sudah selesai/expired diabaikan (mis. langkah "always" di workflow setelah reporter selesai).
  if (!(await activeRun(c.env.DB, runId))) return c.json({ ok: true, ignored: true });

  const at = nowIso();
  const statements = events.flatMap((event) => statementsFor(c.env.DB, runId, event, at));
  statements.push(c.env.DB.prepare('UPDATE runs SET last_event_at = ? WHERE id = ?').bind(at, runId));
  await c.env.DB.batch(statements);
  return c.json({ ok: true, applied: events.length });
});

runnerRoutes.put('/artifacts/*', async (c) => {
  const key = c.req.path.replace(/^\/api\/runner\/artifacts\//, '');
  const match = key.match(/^runs\/([A-Za-z0-9_-]+)\/[A-Za-z0-9._\/-]+$/);
  if (!match || key.includes('..') || !key.startsWith(artifactPrefix(match[1]))) {
    return c.json({ error: 'invalid_key' }, 400);
  }
  if (!(await activeRun(c.env.DB, match[1]))) return c.json({ error: 'run_not_active' }, 409);
  const size = Number(c.req.header('content-length') ?? 0);
  if (!size || size > MAX_ARTIFACT_BYTES) return c.json({ error: 'invalid_size' }, 413);

  await c.env.ARTIFACTS.put(key, c.req.raw.body, {
    httpMetadata: { contentType: c.req.header('content-type') ?? 'application/octet-stream' },
  });
  return c.json({ ok: true, key }, 201);
});
