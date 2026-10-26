import type { GithubStats } from '@kei/shared';
import { Hono, type Context } from 'hono';
import type { AppEnv } from '../env';
import { renderGithubCard } from '../githubCard';
import { readGithubStats, refreshGithubStats } from '../githubStats';

// Statistik GitHub untuk section di situs (JSON) dan README profil (SVG).
export const githubRoutes = new Hono<AppEnv>();

/** Snapshot dari R2; bila belum ada sama sekali, susun sekarang (sekali saja, setelahnya cron). */
async function loadStats(c: Context<AppEnv>): Promise<GithubStats | Response> {
  const stored = await readGithubStats(c.env);
  if (stored) return stored;
  if (!c.env.GITHUB_STATS_TOKEN) return c.json({ error: 'github_disabled' }, 503);
  try {
    const fresh = await refreshGithubStats(c.env, true);
    return fresh ?? c.json({ error: 'github_unavailable' }, 502);
  } catch (err) {
    console.error((err as Error).message);
    return c.json({ error: 'github_unavailable' }, 502);
  }
}

githubRoutes.get('/', async (c) => {
  const stats = await loadStats(c);
  if (stats instanceof Response) return stats;
  c.header('cache-control', 'public, max-age=600');
  return c.json({ stats });
});

githubRoutes.get('/card.svg', async (c) => {
  const stats = await loadStats(c);
  if (stats instanceof Response) return stats;
  const theme = c.req.query('theme') === 'light' ? 'light' : 'dark';
  return c.body(renderGithubCard(stats, theme), 200, {
    'content-type': 'image/svg+xml; charset=utf-8',
    // README GitHub dilayani lewat proxy camo; cache pendek supaya angka ikut segar.
    'cache-control': 'public, max-age=1800',
  });
});
