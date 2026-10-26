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
- Tombol "Download CV" memakai `apps/frontend/public/resume-kei-anggoro.pdf` (`profile.resumeUrl`): salinan CV dengan alamat rumah dan nomor telepon disensor. Saat CV diperbarui, buat ulang salinan yang disensor; jangan commit PDF aslinya.
- Screenshot project dan langkah QA Lab ada di `apps/frontend/public/projects/` dan `public/lab/`.

## Statistik GitHub

Section GitHub di beranda dan kartu SVG untuk README profil (`/api/github/card.svg?theme=dark|light`) dibaca dari snapshot `github/stats.json` di R2. Cron backend memperbaruinya tiap 3 jam: commit harian dari `stats/commit_activity` semua repo milik sendiri (termasuk private, karena grafik kontribusi GitHub tidak menghitungnya) dan ukuran kode per bahasa. Nama repo private tidak ikut keluar.

Butuh secret `GITHUB_STATS_TOKEN`: fine-grained PAT, Repository access **All repositories**, permission **Contents: Read-only** (Metadata ikut otomatis).

```bash
cd apps/backend && npx wrangler secret put GITHUB_STATS_TOKEN
```

Tanpa secret, endpoint mengembalikan 503 dan section GitHub disembunyikan. Isi README profil ada di `readme_github.md`; salin ke repo `keianggoro12/keianggoro12`.
