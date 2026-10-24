import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  // Lokal: /api diteruskan ke backend `wrangler dev` (apps/backend, port 8788).
  server: {
    proxy: { '/api': 'http://localhost:8788' },
  },
});
