// Worker frontend hanya meneruskan /api/* ke backend lewat service binding.
// Browser cukup bicara ke satu origin: tanpa CORS, dan cookie tetap first-party
// (workers.dev ada di Public Suffix List, PRD §5.2). Selain /api/*, aset statis
// dilayani langsung tanpa menjalankan Worker ini (run_worker_first).
interface Env {
  ASSETS: Fetcher;
  BACKEND: Fetcher;
}

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    return pathname.startsWith('/api/') ? env.BACKEND.fetch(request) : env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
