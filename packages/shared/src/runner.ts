// Kontrak data runner ↔ backend ↔ frontend (PRD §9). Dipakai bersama supaya
// reporter, API, dan UI tidak bisa berbeda format diam-diam.

export type RunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'cancelled' | 'expired';
export type RunTrigger = 'visitor' | 'owner' | 'schedule';
export type TestStatus = 'running' | 'passed' | 'failed' | 'skipped';

export const ACTIVE_RUN_STATUSES: RunStatus[] = ['queued', 'running'];

/** Project yang boleh dipicu (punya workflow e2e-<project>.yml). */
export const RUNNABLE_PROJECTS = ['tools'] as const;
export type RunnableProject = (typeof RUNNABLE_PROJECTS)[number];

export type RunnerEvent =
  | { type: 'run.started'; githubRunId?: number; githubRunUrl?: string; total?: number }
  | { type: 'test.begin'; testId: string; tcId: string; title: string; file: string }
  | { type: 'step'; testId: string; index: number; label: string; screenshotKey?: string }
  | { type: 'log'; seq: number; level: 'info' | 'error'; message: string }
  | {
      type: 'test.end';
      testId: string;
      status: Exclude<TestStatus, 'running'>;
      durationMs: number;
      error?: string;
      videoKey?: string;
      networkKey?: string;
    }
  | {
      type: 'run.finished';
      status: 'passed' | 'failed' | 'cancelled';
      passed: number;
      failed: number;
      skipped: number;
      durationMs: number;
    };

export interface RunSummary {
  id: string;
  project: string;
  trigger: RunTrigger;
  status: RunStatus;
  githubRunUrl: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  total: number | null;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number | null;
}

export interface RunStep {
  index: number;
  label: string;
  screenshotKey: string | null;
  at: string;
}

export interface RunTest {
  id: string;
  tcId: string | null;
  title: string;
  file: string | null;
  status: TestStatus;
  durationMs: number | null;
  error: string | null;
  videoKey: string | null;
  networkKey: string | null;
  steps: RunStep[];
}

export interface RunDetail extends RunSummary {
  tests: RunTest[];
}

export interface RunLog {
  seq: number;
  level: 'info' | 'error';
  message: string;
  at: string;
}

/** Key R2 artifact selalu di bawah prefix run-nya. */
export function artifactPrefix(runId: string): string {
  return `runs/${runId}/`;
}
