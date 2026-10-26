import type { GithubDay, GithubLanguage, GithubStats } from '@kei/shared';
import type { Env } from './env';
import { nowIso } from './lib';

// Snapshot aktivitas GitHub disimpan di R2 (bukan D1, jadi tanpa migrasi) dan
// diperbarui cron. Grafik kontribusi GitHub sendiri tidak menghitung commit ke
// repo private, jadi angka diambil dari statistik commit per repo.
export const GITHUB_STATS_KEY = 'github/stats.json';

const FRESH_MS = 3 * 60 * 60_000;
/** Snapshot parsial hanya menggantikan snapshot lengkap yang sudah sebasi ini. */
const PARTIAL_OVERRIDE_MS = 24 * 60 * 60_000;
const DAY_MS = 86_400_000;

const REPO_QUERY = `query {
  viewer {
    login
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
      nodes {
        name
        isPrivate
        pushedAt
        languages(first: 20, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
      }
    }
  }
}`;

interface RepoNode {
  name: string;
  isPrivate: boolean;
  pushedAt: string | null;
  languages: { edges: { size: number; node: { name: string; color: string | null } }[] };
}

interface Viewer {
  login: string;
  followers: { totalCount: number };
  repositories: { nodes: RepoNode[] };
}

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'kei-portfolio-backend',
  };
}

async function fetchViewer(token: string): Promise<Viewer> {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...githubHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: REPO_QUERY }),
  });
  const body = (await response.json().catch(() => null)) as { data?: { viewer: Viewer }; errors?: unknown } | null;
  if (!response.ok || !body?.data) throw new Error(`github graphql ${response.status}`);
  return body.data.viewer;
}

/** Commit per hari 52 minggu terakhir; null bila GitHub masih menghitung (202). */
async function fetchCommitActivity(token: string, owner: string, repo: string): Promise<{ week: number; days: number[] }[] | null> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`, { headers: githubHeaders(token) });
  if (response.status === 202) return null;
  if (response.status === 204) return [];
  if (!response.ok) throw new Error(`commit_activity ${repo} ${response.status}`);
  return response.json();
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export async function buildGithubStats(token: string): Promise<GithubStats> {
  const viewer = await fetchViewer(token);
  const repos = viewer.repositories.nodes;

  // Minggu GitHub dimulai Minggu 00:00 UTC; ambil 52 minggu sampai hari ini.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = today.getTime() - (today.getUTCDay() + 51 * 7) * DAY_MS;

  const active = repos.filter((r) => r.pushedAt && Date.parse(r.pushedAt) >= start);
  const activity = await Promise.all(active.map((r) => fetchCommitActivity(token, viewer.login, r.name)));

  const counts = new Map<string, number>();
  for (const weeks of activity) {
    for (const { week, days } of weeks ?? []) {
      days.forEach((count, i) => {
        if (count > 0) {
          const date = isoDate(week * 1000 + i * DAY_MS);
          counts.set(date, (counts.get(date) ?? 0) + count);
        }
      });
    }
  }
  const days: GithubDay[] = [];
  for (let ms = start; ms <= today.getTime(); ms += DAY_MS) {
    const date = isoDate(ms);
    days.push({ date, count: counts.get(date) ?? 0 });
  }

  const languages = new Map<string, GithubLanguage>();
  for (const repo of repos) {
    for (const { size, node } of repo.languages.edges) {
      const entry = languages.get(node.name) ?? { name: node.name, color: node.color, bytes: 0 };
      entry.bytes += size;
      languages.set(node.name, entry);
    }
  }

  const privateCount = repos.filter((r) => r.isPrivate).length;
  return {
    login: viewer.login,
    generatedAt: nowIso(),
    days,
    languages: [...languages.values()].sort((a, b) => b.bytes - a.bytes),
    repos: { total: repos.length, public: repos.length - privateCount, private: privateCount },
    followers: viewer.followers.totalCount,
    partial: activity.some((a) => a === null),
  };
}

export async function readGithubStats(env: Env): Promise<GithubStats | null> {
  const object = await env.ARTIFACTS.get(GITHUB_STATS_KEY);
  return object ? object.json<GithubStats>() : null;
}

/**
 * Perbarui snapshot bila sudah basi (atau parsial). Snapshot parsial tidak
 * menimpa snapshot lengkap yang masih cukup baru; cron berikutnya mencoba lagi.
 */
export async function refreshGithubStats(env: Env, force = false): Promise<GithubStats | null> {
  if (!env.GITHUB_STATS_TOKEN) return null;
  const head = await env.ARTIFACTS.head(GITHUB_STATS_KEY);
  const meta = head?.customMetadata;
  const age = meta?.generatedAt ? Date.now() - Date.parse(meta.generatedAt) : Infinity;
  if (!force && meta?.partial === 'false' && age < FRESH_MS) return null;

  const stats = await buildGithubStats(env.GITHUB_STATS_TOKEN);
  if (stats.partial && meta?.partial === 'false' && age < PARTIAL_OVERRIDE_MS) return null;
  await env.ARTIFACTS.put(GITHUB_STATS_KEY, JSON.stringify(stats), {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: { generatedAt: stats.generatedAt, partial: String(stats.partial) },
  });
  return stats;
}
