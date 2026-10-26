import type { Env } from './env';
import { refreshGithubStats } from './githubStats';
import { isoMinutesAgo, nowIso } from './lib';

const QUEUED_TIMEOUT_MIN = 15;
const RUNNING_IDLE_TIMEOUT_MIN = 30;
const RETENTION_DAYS = 30;
const RETENTION_BATCH = 10;

/** Dua tugas saling lepas: gagal satu tidak membatalkan yang lain; dicoba lagi di cron berikutnya. */
export async function runScheduled(env: Env): Promise<void> {
  const results = await Promise.allSettled([cleanupRuns(env), refreshGithubStats(env)]);
  for (const result of results) {
    if (result.status === 'rejected') console.error((result.reason as Error).message);
  }
}

/** Run macet → expired (PRD §5.3 langkah 7), lalu hapus run > 30 hari kecuali pinned (SEC-07). */
async function cleanupRuns(env: Env): Promise<void> {
  await env.DB.prepare(
    `UPDATE runs SET status = 'expired', finished_at = ?
     WHERE (status = 'queued' AND created_at < ?)
        OR (status = 'running' AND COALESCE(last_event_at, started_at, created_at) < ?)`
  )
    .bind(nowIso(), isoMinutesAgo(QUEUED_TIMEOUT_MIN), isoMinutesAgo(RUNNING_IDLE_TIMEOUT_MIN))
    .run();

  const { results } = await env.DB.prepare('SELECT id FROM runs WHERE created_at < ? AND pinned = 0 LIMIT ?')
    .bind(isoMinutesAgo(RETENTION_DAYS * 24 * 60), RETENTION_BATCH)
    .all<{ id: string }>();
  for (const { id } of results) {
    let cursor: string | undefined;
    do {
      const page = await env.ARTIFACTS.list({ prefix: `runs/${id}/`, cursor });
      if (page.objects.length) await env.ARTIFACTS.delete(page.objects.map((o) => o.key));
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
    await env.DB.batch([
      env.DB.prepare('DELETE FROM steps WHERE run_id = ?').bind(id),
      env.DB.prepare('DELETE FROM run_logs WHERE run_id = ?').bind(id),
      env.DB.prepare('DELETE FROM test_results WHERE run_id = ?').bind(id),
      env.DB.prepare('DELETE FROM runs WHERE id = ?').bind(id),
    ]);
  }
}
