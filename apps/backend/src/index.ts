import { Hono } from 'hono';
import { runScheduled } from './cron';
import type { AppEnv, Env } from './env';
import { githubRoutes } from './routes/github';
import { publicRoutes } from './routes/public';
import { runnerRoutes } from './routes/runner';

const app = new Hono<AppEnv>();

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'internal_error' }, 500);
});

app.get('/', (c) => c.text('kei-portfolio-backend'));
app.route('/api/runner', runnerRoutes);
app.route('/api/github', githubRoutes);
app.route('/api', publicRoutes);
app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default {
  fetch: app.fetch,
  scheduled: (_event, env, ctx) => {
    ctx.waitUntil(runScheduled(env));
  },
} satisfies ExportedHandler<Env>;
