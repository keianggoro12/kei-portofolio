-- QA Lab: hasil run Playwright (PRD §8)
CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  project TEXT NOT NULL,
  suite TEXT NOT NULL DEFAULT 'full',
  trigger TEXT NOT NULL,
  status TEXT NOT NULL,
  github_run_id INTEGER,
  github_run_url TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  last_event_at TEXT,
  total INTEGER,
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  requester_hash TEXT,
  pinned INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX runs_project_created ON runs (project, created_at DESC);
CREATE INDEX runs_status ON runs (status);

CREATE TABLE test_results (
  id TEXT NOT NULL,
  run_id TEXT NOT NULL REFERENCES runs (id) ON DELETE CASCADE,
  tc_id TEXT,
  title TEXT NOT NULL,
  file TEXT,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  error TEXT,
  video_key TEXT,
  network_key TEXT,
  started_at TEXT NOT NULL,
  PRIMARY KEY (run_id, id)
);

CREATE TABLE steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES runs (id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  label TEXT NOT NULL,
  screenshot_key TEXT,
  at TEXT NOT NULL
);
CREATE INDEX steps_run ON steps (run_id, test_id, idx);

CREATE TABLE run_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES runs (id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX run_logs_run_seq ON run_logs (run_id, seq);

-- Maksimal satu run aktif per project (PRD SEC-04), juga saat dua request datang bersamaan.
CREATE UNIQUE INDEX runs_one_active_per_project ON runs (project) WHERE status IN ('queued', 'running');
