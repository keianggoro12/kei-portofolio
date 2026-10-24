# Kei Portfolio

Situs portofolio Juliardi Dwi Anggoro (Kei), Senior QA Engineer, plus QA Lab: automation test Playwright sungguhan terhadap project Kei. Detail produk di [PRD.md](PRD.md).

## Struktur

| Folder | Isi |
| --- | --- |
| `apps/frontend` | SPA React + Vite + Tailwind, di-deploy sebagai Cloudflare Workers static assets |
| `packages/shared` | Konten profil, pengalaman, skill, project, dan hasil run terakhir (EN/ID) |
| `automation/helpmycv` | Suite Playwright untuk HelpMyCV (lihat README di folder itu) |

## Menjalankan frontend

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build ke apps/frontend/dist
```

Deploy: `npm run deploy -w @kei/frontend` (butuh `wrangler login`).

## Mengubah konten

Semua teks ada di `packages/shared/src/profile.ts` dan `projects.ts`, masing-masing dalam Inggris dan Indonesia. Teks UI (tombol, judul section) ada di `apps/frontend/src/lib/i18n.tsx`.

- Foto: `apps/frontend/public/kei.jpg`.
- Tombol "Download CV" baru muncul bila `profile.resumeUrl` diisi. Taruh PDF CV **tanpa alamat rumah dan nomor telepon** di `apps/frontend/public/`, lalu isi path-nya.
- Screenshot project dan langkah QA Lab ada di `apps/frontend/public/projects/` dan `public/lab/`.
