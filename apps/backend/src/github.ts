import type { Env } from './env';

/** Picu workflow e2e-<project>.yml dengan input run_id (PRD §5.3 langkah 2). */
export async function dispatchWorkflow(env: Env, project: string, runId: string): Promise<void> {
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/e2e-${project}.yml/dispatches`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'kei-portfolio-backend',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: env.GITHUB_REF, inputs: { run_id: runId } }),
  });
  if (!response.ok) {
    // Body GitHub tidak berisi token; aman untuk log.
    throw new Error(`workflow_dispatch ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
}
