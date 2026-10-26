import type { GithubStats, RunDetail, RunLog, RunStatus, RunSummary } from '@kei/shared';
import { useEffect, useState } from 'react';

export interface LabConfig {
  runEnabled: boolean;
  turnstileSiteKey: string | null;
}

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new ApiError(response.status, body.error ?? 'request_failed');
  return body;
}

export const api = {
  config: () => request<LabConfig>('/config'),
  runs: (project: string) => request<{ runs: RunSummary[] }>(`/runs?project=${project}&limit=20`).then((r) => r.runs),
  run: (id: string) => request<{ run: RunDetail }>(`/runs/${id}`).then((r) => r.run),
  logs: (id: string, after: number) => request<{ logs: RunLog[] }>(`/runs/${id}/logs?after=${after}`).then((r) => r.logs),
  createRun: (project: string, turnstileToken: string) =>
    request<{ runId: string; joined: boolean }>('/runs', { method: 'POST', body: JSON.stringify({ project, turnstileToken }) }),
  github: () => request<{ stats: GithubStats }>('/github').then((r) => r.stats),
};

export function artifactUrl(key: string): string {
  return `/api/artifacts/${key}`;
}

export function isActive(status: RunStatus): boolean {
  return status === 'queued' || status === 'running';
}

/** Config Lab dibaca sekali per halaman; gagal = tombol Run disembunyikan. */
let configPromise: Promise<LabConfig> | null = null;
export function useLabConfig(): LabConfig | null {
  const [config, setConfig] = useState<LabConfig | null>(null);
  useEffect(() => {
    configPromise ??= api.config().catch(() => ({ runEnabled: false, turnstileSiteKey: null }));
    let alive = true;
    void configPromise.then((c) => alive && setConfig(c));
    return () => {
      alive = false;
    };
  }, []);
  return config;
}
