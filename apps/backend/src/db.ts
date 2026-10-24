import type { RunDetail, RunLog, RunStatus, RunSummary, RunTest, RunTrigger, TestStatus } from '@kei/shared';

interface RunRow {
  id: string;
  project: string;
  trigger: string;
  status: string;
  github_run_url: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  total: number | null;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number | null;
}

interface TestRow {
  id: string;
  tc_id: string | null;
  title: string;
  file: string | null;
  status: string;
  duration_ms: number | null;
  error: string | null;
  video_key: string | null;
  network_key: string | null;
}

interface StepRow {
  test_id: string;
  idx: number;
  label: string;
  screenshot_key: string | null;
  at: string;
}

const RUN_COLUMNS =
  'id, project, trigger, status, github_run_url, created_at, started_at, finished_at, total, passed, failed, skipped, duration_ms';

function toSummary(row: RunRow): RunSummary {
  return {
    id: row.id,
    project: row.project,
    trigger: row.trigger as RunTrigger,
    status: row.status as RunStatus,
    githubRunUrl: row.github_run_url,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    total: row.total,
    passed: row.passed,
    failed: row.failed,
    skipped: row.skipped,
    durationMs: row.duration_ms,
  };
}

export async function listRuns(db: D1Database, project: string, limit: number): Promise<RunSummary[]> {
  const { results } = await db
    .prepare(`SELECT ${RUN_COLUMNS} FROM runs WHERE project = ? ORDER BY created_at DESC LIMIT ?`)
    .bind(project, limit)
    .all<RunRow>();
  return results.map(toSummary);
}

export async function getActiveRunId(db: D1Database, project: string): Promise<string | null> {
  const row = await db
    .prepare("SELECT id FROM runs WHERE project = ? AND status IN ('queued', 'running') ORDER BY created_at DESC LIMIT 1")
    .bind(project)
    .first<{ id: string }>();
  return row?.id ?? null;
}

export async function getRunDetail(db: D1Database, id: string): Promise<RunDetail | null> {
  const [run, tests, steps] = await db.batch([
    db.prepare(`SELECT ${RUN_COLUMNS} FROM runs WHERE id = ?`).bind(id),
    db.prepare('SELECT id, tc_id, title, file, status, duration_ms, error, video_key, network_key FROM test_results WHERE run_id = ? ORDER BY started_at').bind(id),
    db.prepare('SELECT test_id, idx, label, screenshot_key, at FROM steps WHERE run_id = ? ORDER BY test_id, idx, id').bind(id),
  ]);
  const runRow = (run.results as RunRow[])[0];
  if (!runRow) return null;

  const stepsByTest = new Map<string, RunTest['steps']>();
  for (const step of steps.results as StepRow[]) {
    const list = stepsByTest.get(step.test_id) ?? [];
    list.push({ index: step.idx, label: step.label, screenshotKey: step.screenshot_key, at: step.at });
    stepsByTest.set(step.test_id, list);
  }

  return {
    ...toSummary(runRow),
    tests: (tests.results as TestRow[]).map((t) => ({
      id: t.id,
      tcId: t.tc_id,
      title: t.title,
      file: t.file,
      status: t.status as TestStatus,
      durationMs: t.duration_ms,
      error: t.error,
      videoKey: t.video_key,
      networkKey: t.network_key,
      steps: stepsByTest.get(t.id) ?? [],
    })),
  };
}

export async function getLogs(db: D1Database, runId: string, afterSeq: number, limit = 500): Promise<RunLog[]> {
  const { results } = await db
    .prepare('SELECT seq, level, message, at FROM run_logs WHERE run_id = ? AND seq > ? ORDER BY seq LIMIT ?')
    .bind(runId, afterSeq, limit)
    .all<RunLog>();
  return results;
}
