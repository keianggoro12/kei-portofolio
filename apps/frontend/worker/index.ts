// Worker frontend meneruskan /api/* ke backend lewat service binding.
// Browser cukup bicara ke satu origin: tanpa CORS, dan cookie tetap first-party
// (PRD §5.2). Selain /api/*, aset statis dilayani dari ASSETS.
interface Env {
  ASSETS: Fetcher;
  BACKEND: Fetcher;
}

const CANONICAL_HOST = 'kei-portfolio.eiklab.com';

export default {
  fetch(request, env) {
    const url = new URL(request.url);
    // Alamat lama *.workers.dev pindah permanen ke domain utama, path dan query ikut.
    if (url.hostname.endsWith('.workers.dev')) {
      url.protocol = 'https:';
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }
    return url.pathname.startsWith('/api/') ? env.BACKEND.fetch(request) : env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
