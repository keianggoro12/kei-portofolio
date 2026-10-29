# PRD — Kei Portfolio (QA Engineer + QA Lab)

**Version:** 0.1
**Updated:** 2026-10-24
**Status:** Draft

---

## 1. Ringkasan

Situs portofolio pribadi Kei sebagai **Senior QA Engineer**. Selain profil, pengalaman, dan daftar project, situs ini punya **QA Lab**: halaman tempat pengunjung bisa melihat (dan memicu) automation test Playwright yang berjalan sungguhan terhadap project Kei, lengkap dengan log live, screenshot per langkah, video, dan report.

QA Lab adalah versi online dari Automation Newsroom (`automation-frontend-single-brand`). Bedanya: runner tidak lagi berjalan di laptop (`Express + Socket.io :3001`), tetapi di **GitHub Actions**, dan hasilnya disimpan di **Cloudflare D1 + R2** lalu ditampilkan oleh situs yang berjalan di **Cloudflare Workers**.

Pesan yang ingin disampaikan ke recruiter/klien: "Saya tidak hanya menulis test, saya membangun infrastruktur testing end-to-end, dan buktinya bisa Anda jalankan sendiri sekarang."

---

## 2. Tujuan

1. Menampilkan profil Kei sebagai Senior QA Engineer dengan jelas dan cepat dibaca.
2. Menampilkan project yang Kei develop sendiri: Jastip, Tools from Eiklab, Undangan.
3. Membuktikan kemampuan QA lewat automation yang bisa dilihat berjalan, bukan hanya diklaim.
4. Menyimpan riwayat run (pass rate, durasi, flaky test) sebagai bukti kualitas jangka panjang.

### Non-goal

- Bukan platform testing umum untuk orang lain (pengunjung tidak bisa menambah test atau target sendiri).
- Bukan load/performance testing.
- Bukan visual regression pixel-perfect.
- Tidak semua project punya automation. Saat ini hanya **Tools from Eiklab**.

---

## 3. Pengguna

| Pengguna | Kebutuhan |
| --- | --- |
| **Recruiter / hiring manager** | Dalam 1–2 menit paham siapa Kei, skill apa, dan melihat bukti nyata. Tidak teknis. |
| **Engineer / QA lead** (interviewer teknis) | Melihat struktur test, arsitektur runner, report detail, kode di GitHub. |
| **Kei (owner)** | Memicu run kapan saja, melihat riwayat, mengatur suite dan batas pemakaian. |

---

## 4. Fitur

### 4.1 Halaman portofolio

| Route | Isi |
| --- | --- |
| `/` | Hero (nama, "Senior QA Engineer", ringkasan 1 kalimat), CTA ke QA Lab dan CV, highlight angka (tahun pengalaman, jumlah test case, pass rate terakhir) |
| `/about` | Profil, pengalaman kerja, skill (manual testing, automation, API testing, CI/CD, tools) |
| `/projects` | Kartu project: Jastip, Tools from Eiklab, Undangan. Tiap kartu: deskripsi, stack, link live, dan badge **Automation: Available / Not yet** |
| `/projects/:slug` | Detail project + case study QA (strategi test, risiko, apa yang diotomasi dan kenapa) |
| `/lab` | QA Lab: daftar project yang punya automation + status run terakhir |
| `/lab/:project` | Runner per project (lihat §4.2) |
| `/lab/:project/runs/:runId` | Detail satu run (live atau replay) |
| `/contact` | Kontak, link LinkedIn/GitHub, unduh CV PDF |

Data project (judul, deskripsi, link, `hasAutomation`) disimpan sebagai file konfigurasi statis di repo, bukan di D1. Project baru = tambah satu entri.

### 4.2 QA Lab — Runner

Fitur meniru Automation Newsroom, disesuaikan untuk pengunjung publik.

| Fitur | Keterangan |
| --- | --- |
| **Pilih suite** | `smoke`, `sanity`, `full` (definisi di §6). Pengunjung publik hanya boleh `smoke`/`sanity`; `full` hanya untuk owner atau jadwal. |
| **Run** | Tombol memicu run baru. Dilindungi Turnstile + rate limit (§7). |
| **Status run** | `queued` → `running` → `passed` / `failed` / `cancelled` / `expired`. Tampilkan estimasi: runner GitHub butuh ±30–90 detik untuk mulai. |
| **Tab Log** | Log live dari runner (stdout reporter). |
| **Tab Langkah** | Screenshot per langkah per test: daftar test, gambar besar, ← →, filmstrip, layar penuh. Reuse `StepsView.tsx`. |
| **Tab Video** | Video per test (mp4, supaya jalan di Safari). |
| **Tab Network** | Ringkasan request per test (`network.json`). |
| **Tab Report** | Tabel TC (ID, nama, status, durasi, error) + unduh PDF. Reuse `ReportView.tsx` dan `pdf-report.ts`. |
| **Replay** | Run lama bisa dibuka ulang dengan tampilan yang sama (data dari D1 + R2). |
| **Nonton run yang sedang jalan** | Kalau sudah ada run berjalan, pengunjung lain otomatis ikut menonton run itu, bukan membuat run baru. |

### 4.3 Riwayat & dashboard

- Daftar run per project: waktu, pemicu (`visitor` / `owner` / `schedule`), suite, hasil, durasi, link ke run GitHub Actions.
- Grafik pass rate dan durasi 30 hari.
- Daftar test paling sering gagal / flaky.
- Run terjadwal (cron) memastikan riwayat terus terisi walau tidak ada pengunjung.

### 4.4 Admin (owner)

- Login hanya untuk owner (Kei). Satu akun, tidak ada registrasi, tidak ada login Google.
  - Email owner dan hash password (PBKDF2) disimpan sebagai Worker secret `OWNER_EMAIL` / `OWNER_PASSWORD_HASH`, bukan di D1 atau repo.
  - Login berhasil → token sesi acak di tabel `sessions`, dikirim sebagai cookie `HttpOnly; Secure; SameSite=Strict`. Logout = hapus baris sesi.
  - Login gagal 5× dari IP yang sama dalam 15 menit → dikunci 15 menit.
  - Route `/admin` dan semua endpoint owner menolak request tanpa sesi valid.
- Memicu suite apa pun, membatalkan run, menghapus run.
- Mengatur: kuota run publik per hari, suite yang boleh dipicu publik, on/off tombol Run publik.

### 4.5 Konten profil

Sumber: `Resume Kei Anggoro Publik.pdf` (menggantikan `resume kei desu.pdf`). Konten disimpan sebagai file data statis di `packages/shared` (bukan di D1), dalam Inggris dan Indonesia.

**Identitas**

| Field | Isi |
| --- | --- |
| Nama | Juliardi Dwi Anggoro (Kei) |
| Role | Senior QA Engineer |
| Lokasi | Jakarta, Indonesia |
| Kontak publik | `keianggoro12@gmail.com`, `github.com/keianggoro12` |
| Ringkasan | Senior QA Engineer yang fokus pada end-to-end test automation dengan Playwright dan TypeScript: menyusun test plan, menjalankan test case, membangun framework automation, dan bekerja lintas tim untuk menjaga kualitas produk. Paham SDLC penuh dan punya pengalaman membangun web/app sendiri. |

**Pengalaman** (urutan terbaru dulu)

| Periode | Role | Perusahaan | Poin utama |
| --- | --- | --- | --- |
| Nov 2024 – sekarang | Senior Quality Assurance | PT Tempo Inti Media Tbk, Jakarta | Memimpin tim QA dari backlog grooming sampai rilis production; framework automation UI & API (Playwright + TypeScript); skrip UAT; investigasi isu dan dukungan deployment bersama tim produk |
| Nov 2024 – Mar 2026 | Quality Assurance Automation Engineer (Freelance) | Kinobi AI, Singapura | Automation UI & API (Playwright + TypeScript); skenario test yang maintainable; meningkatkan stabilitas dan efisiensi eksekusi test |
| Mar 2024 – Nov 2024 | Quality Assurance Engineer | Kinobi AI, Singapura | Eksekusi test case; skrip UAT; investigasi bug bersama engineering & produk; kick-off project dan deployment |
| Aug 2022 – Nov 2022 | Student Mentor | Terra AI, Singapura | Membimbing 20 siswa dalam conversational design dan pengembangan chatbot |
| Feb 2022 – Jul 2022 | Chatbot Developer Intern (Tokobot) | Terra AI, Singapura | Infrastruktur dan template chatbot untuk UMKM |

**Skill**: Playwright (Advanced), TypeScript (Advanced), API & UI Automation Testing (Expert), Postman (Expert), Git & GitHub (Advanced). Ditambah dari project sendiri: Cloudflare Workers, D1, R2, GitHub Actions.

**Pendidikan**: Universitas Muhammadiyah Buton, S1 Ilmu Pemerintahan, IPK 3,81/4,00, Cum Laude (2018–2022).

**Sertifikasi**: Certificate in Quality Assurance Engineer, Alterra Academy (Feb 2024); Advance Microsoft Excel, MySkill.

**Highlight di Home**

| Angka | Sumber | Catatan |
| --- | --- | --- |
| Tahun di QA | Dihitung dari Mar 2024 saat build | Jangan dibulatkan ke atas |
| Jumlah test case automation | D1 (`test_results` distinct `tc_id`) | Live |
| Pass rate 30 hari | D1 `runs` | Live |
| Project live | Daftar project | 3 (Jastip, Tools from Eiklab, Undangan) |

**Aturan privasi**

- Alamat rumah dan nomor telepon **tidak** ditampilkan di situs (repo publik dan situs publik bisa di-scrape).
- Tombol "Download CV" memakai `Resume Kei Anggoro Publik.pdf`, disalin ke `apps/frontend/public/` sebagai `resume-kei-anggoro.pdf`. Syarat sebelum di-commit: PDF itu tidak berisi alamat rumah dan nomor telepon (per 2026-10-24 keduanya masih ada, jadi belum boleh di-commit).
- File `resume kei desu.pdf` (versi pribadi) tidak di-commit (masuk `.gitignore`).

---

## 5. Arsitektur

### 5.1 Komponen

```
Pengunjung (browser)
   │  HTTPS + WebSocket (satu origin)
   ▼
Worker "kei-portfolio-frontend"   (apps/frontend)
   ├─ Static assets (SPA React + Vite)
   └─ /api/*  ── diteruskan lewat service binding BACKEND
   │
   ▼
Worker "kei-portfolio-backend"    (apps/backend)
   ├─ API (Hono)
   ├─ Durable Object RunChannel   ── broadcast event live ke penonton
   ├─ D1  ── runs, test_results, steps, logs, settings, sessions
   ├─ R2  ── screenshot, video, network.json, trace, report
   └─ Cron Trigger ── tandai run macet sebagai expired, picu run terjadwal, retensi
   │
   │  GitHub REST API: workflow_dispatch (token disimpan sebagai Worker secret)
   ▼
GitHub Actions workflow "e2e-tools.yml"
   └─ Playwright (Chromium) + custom reporter
        │  POST event + upload artifact (Bearer RUNNER_TOKEN)
        ▼
      kembali ke backend /api/runner/*
        │
        └─ Target: https://staging-tools.eiklab.com
```

### 5.2 Kenapa begini

| Keputusan | Alasan |
| --- | --- |
| **Runner di GitHub Actions, bukan di Worker** | Worker tidak bisa menjalankan `@playwright/test` beserta browser penuh, video recording, dan test runner. Actions memberi VM Linux sungguhan dan gratis untuk repo publik. |
| **Workers static assets, bukan Pages** | Project lain (Tools from Eiklab, Jastip, Undangan) sudah di Workers. Pages tidak dibutuhkan. |
| **Frontend dan backend Worker terpisah** | Pola sama dengan Tools from Eiklab: deploy, log, dan rollback masing-masing berdiri sendiri. Perubahan UI tidak men-deploy ulang API, dan sebaliknya. |
| **`/api/*` lewat service binding, bukan dipanggil langsung** | `workers.dev` ada di Public Suffix List, jadi dua subdomain `*.keianggoro12.workers.dev` dianggap beda site dan cookie sesi `SameSite=Strict` tidak terkirim. Dengan service binding, browser hanya bicara ke origin frontend: cookie, CORS, dan WebSocket jadi sederhana. |
| **Durable Object untuk live** | `socket.io` tidak jalan di Workers. Durable Object dengan WebSocket (hibernation) menggantikan peran socket server: runner POST event → DO broadcast ke semua penonton. D1 saja tidak bisa push. |
| **D1 untuk data terstruktur, R2 untuk file** | Event dan hasil test kecil dan perlu di-query (riwayat, pass rate). Screenshot/video besar dan cukup diambil per URL. |
| **Reporter yang mengirim event** | Pengganti `reporters/step-reporter.ts` + `server.js`. Reporter memanggil API Worker, sehingga format event sama dengan Automation Newsroom dan komponen UI bisa dipakai ulang. |

### 5.3 Alur satu run

1. Pengunjung klik **Run** di `/lab/tools`. Browser mengirim token Turnstile.
2. Worker: validasi Turnstile, cek rate limit dan apakah sudah ada run aktif.
   - Ada run aktif → kembalikan `runId` run itu (pengunjung ikut menonton).
   - Tidak ada → buat baris `runs` (`status=queued`), panggil `POST /repos/{owner}/{repo}/actions/workflows/e2e-tools.yml/dispatches` dengan input `{ run_id, suite }`.
3. Browser membuka WebSocket ke `RunChannel` untuk `runId` itu, dan memuat event yang sudah ada dari D1.
4. Job Actions mulai. Reporter mengirim `run.started` (berisi `github_run_id` dan URL run).
5. Selama test: `test.begin`, `step` (+ upload screenshot ke R2), `log`, `test.end` (+ upload video/network).
6. Selesai: `run.finished` dengan ringkasan. Worker update `runs`, DO broadcast, koneksi ditutup.
7. Cron Worker tiap 5 menit: run `queued` > 10 menit atau `running` > 30 menit tanpa event → `expired`.

### 5.4 Struktur repo (usulan)

```
kei-portofolio/
├─ apps/frontend/            # React + Vite (SPA). Reuse komponen dari playwright-ui-react
│  └─ wrangler.toml          # static assets + service binding BACKEND
├─ apps/backend/             # Hono API, Durable Object RunChannel, cron
│  ├─ migrations/            # D1 migrations
│  └─ wrangler.toml          # D1, R2, DO, cron
├─ automation/tools/      # Project Playwright (pola POM sama seperti automation-frontend-single-brand)
│  ├─ tests/ pages/ locators/ helpers/ fixtures/ utils/
│  ├─ reporters/cloud-reporter.ts
│  └─ playwright.config.ts
├─ packages/shared/          # Tipe event runner ↔ backend ↔ frontend, daftar project
└─ .github/
   ├─ actions/setup/action.yml   # composite: checkout, Node 22, npm ci (cache)
   └─ workflows/
      ├─ ci.yml                  # PR: typecheck, lint, test, build
      ├─ deploy-frontend.yml
      ├─ deploy-backend.yml
      └─ e2e-tools.yml        # workflow_dispatch + schedule
```

Automation project berikutnya (Jastip, Undangan) = folder baru di `automation/` + satu workflow `e2e-<project>.yml` + satu entri di daftar project.

### 5.5 GitHub Actions

Prinsip: satu workflow = satu tugas, nama file menjelaskan tugasnya, dan tiap workflow hanya jalan bila path miliknya berubah.

| Workflow | Pemicu | Isi job | Secret |
| --- | --- | --- | --- |
| `ci.yml` | `pull_request` ke `main` | Job `frontend`, `backend`, `automation` paralel, masing-masing hanya bila path-nya berubah (`dorny/paths-filter`): typecheck, lint, unit test, build. Backend juga `wrangler deploy --dry-run`. | Tidak ada |
| `deploy-frontend.yml` | `push` ke `main` di `apps/frontend/**`, `packages/shared/**`; `workflow_dispatch` | Build Vite → `wrangler deploy` | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| `deploy-backend.yml` | `push` ke `main` di `apps/backend/**`, `packages/shared/**`; `workflow_dispatch` | `wrangler d1 migrations apply --remote` → `wrangler deploy` | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| `e2e-tools.yml` | `workflow_dispatch` (input `run_id`, `suite`), `schedule` harian | Install Chromium (cache) → `playwright test --grep @<suite>` → cloud reporter kirim hasil ke backend | `RUNNER_TOKEN`, `BACKEND_URL`, `TOOLS_BOT_EMAIL`, `TOOLS_BOT_PASSWORD` |

Aturan:

| ID | Aturan |
| --- | --- |
| GHA-01 | Langkah setup yang sama (checkout, Node 22, `npm ci` dengan cache) ditulis sekali di `.github/actions/setup/action.yml` dan dipakai semua workflow. |
| GHA-02 | `permissions: contents: read` di semua workflow; tidak ada izin lebih dari yang dibutuhkan. |
| GHA-03 | `concurrency` per workflow: deploy `deploy-frontend` / `deploy-backend` tidak boleh tumpang tindih (`cancel-in-progress: false`); `e2e-tools` maks 1 run (`group: e2e-tools`). |
| GHA-04 | Deploy memakai GitHub Environment `production`, sehingga secret Cloudflare hanya terbuka untuk job deploy. |
| GHA-05 | Backend selalu migrasi D1 dulu baru deploy. Migration harus aman dijalankan ulang dan kompatibel dengan kode lama (tambah kolom/tabel, jangan hapus di rilis yang sama). |
| GHA-06 | Bila perubahan menyentuh `packages/shared/**`, backend deploy dulu baru frontend, supaya frontend tidak memanggil API yang belum ada. Caranya: `deploy-frontend.yml` memakai `workflow_run` setelah `deploy-backend.yml` sukses untuk perubahan shared. |
| GHA-07 | `e2e-tools.yml` tidak pernah dipicu `pull_request`, supaya secret bot tidak terekspos ke kode dari PR. |
| GHA-08 | Nama job dan step jelas dan berbahasa Inggris (`Build frontend`, `Apply D1 migrations`), mengikuti workflow Tools from Eiklab. |
| GHA-09 | Bila step `e2e` gagal sebelum reporter sempat mengirim `run.finished`, step `if: always()` di akhir job mengirim `run.finished` dengan `status=failed`, supaya run di situs tidak menggantung. |

---

## 6. Suite & coverage Tools from Eiklab

Target: `https://staging-tools.eiklab.com` (staging). Test tidak pernah diarahkan ke production `https://tools.eiklab.com`.

| Suite | Isi | Siapa yang boleh memicu | Estimasi durasi |
| --- | --- | --- | --- |
| `smoke` | Halaman publik terbuka, ganti bahasa EN/ID, ganti tema, katalog tools tampil | Publik, owner, schedule | ≤ 2 menit |
| `sanity` | `smoke` + login akun test, dashboard, buat CV → edit → hapus (cleanup), 1–2 tool client-side (JSON Toolkit, JWT Decoder, Kompres gambar) | Publik, owner, schedule | ≤ 5 menit |
| `full` | `sanity` + editor CV lengkap (section, reorder, hide), PDF tools berbasis browser dengan fixture file, DB Diagram | Owner, schedule | ≤ 15 menit |

### Tidak diotomasi (sengaja)

| Fitur | Alasan |
| --- | --- |
| Auto CV (AI) | Memakan kuota API AI berbayar tiap run. |
| Login Google | OAuth Google tidak bisa diotomasi dengan stabil dan melanggar ToS bila dipaksa. |
| Area admin | Tidak boleh ada kredensial admin di runner yang bisa dipicu publik. |
| Bagikan PDF, Konverter PDF server-side | Menulis ke R2 Tools from Eiklab / memakai penyedia konversi berbayar. |

Catatan untuk case study: PRD Tools from Eiklab §8 menyebut alat yang butuh browser sungguhan (render HTML ke gambar, PDF ke gambar, sensor, canvas DB Diagram) belum terotomasi. QA Lab menutup celah ini.

### Aturan test data

- Satu akun khusus test (`qa-bot@...`), bukan akun pribadi. Kredensial di GitHub Secrets.
- Semua data yang dibuat diberi prefix `[QA-BOT]` dan dihapus di akhir test (dan di `globalTeardown` bila test gagal di tengah).
- Test tidak boleh mengubah data milik user lain.

---

## 7. Keamanan & batas pemakaian

Tombol Run publik berarti siapa pun bisa memakai menit GitHub Actions dan mengirim traffic ke staging Tools from Eiklab. Karena itu:

| ID | Aturan |
| --- | --- |
| SEC-01 | Token GitHub (fine-grained PAT, hanya `actions:write` di repo ini) disimpan sebagai Worker secret. Tidak pernah dikirim ke browser. |
| SEC-02 | Endpoint `/api/runner/*` hanya menerima `Authorization: Bearer RUNNER_TOKEN`. Token ada di GitHub Secrets dan Worker secret. Event wajib membawa `run_id` yang statusnya `queued`/`running`. |
| SEC-03 | Turnstile wajib untuk memicu run publik. |
| SEC-04 | Maksimal **1 run aktif** per project (`concurrency` di workflow + cek di Worker). |
| SEC-05 | Kuota publik: maks 3 run / IP / hari (IP disimpan sebagai hash) dan maks 20 run publik / hari total. Bisa diubah owner. |
| SEC-06 | Screenshot/video tidak boleh memperlihatkan password. Field password di-mask sebelum `snap`, dan log tidak mencetak kredensial. |
| SEC-07 | Artifact di R2 dibaca lewat Worker (bukan bucket publik), dengan retensi 30 hari; run yang ditandai owner sebagai "pinned" tidak dihapus. |
| SEC-08 | Workflow `e2e-tools.yml` tidak berjalan untuk `pull_request` dari fork, supaya secret tidak bocor. |

---

## 8. Data (D1)

| Tabel | Kolom utama |
| --- | --- |
| `runs` | `id`, `project`, `suite`, `trigger` (`visitor`/`owner`/`schedule`), `status`, `github_run_id`, `github_run_url`, `created_at`, `started_at`, `finished_at`, `passed`, `failed`, `skipped`, `duration_ms`, `requester_hash`, `pinned` |
| `test_results` | `id`, `run_id`, `tc_id`, `title`, `file`, `status`, `duration_ms`, `error`, `retry`, `video_key`, `network_key` |
| `steps` | `id`, `test_result_id`, `index`, `label`, `screenshot_key`, `at` |
| `run_logs` | `id`, `run_id`, `seq`, `level`, `message`, `at` |
| `settings` | `key`, `value` (kuota, suite publik, tombol Run on/off) |
| `sessions` | `token_hash`, `created_at`, `expires_at` (sesi login owner, 7 hari) |
| `login_attempts` | `ip_hash`, `at` (untuk lockout login) |

### 8.1 Kapan data ditulis

Tiap run GitHub Actions menyimpan hasilnya sendiri, tanpa langkah manual:

| Saat | Siapa | Ditulis ke |
| --- | --- | --- |
| Run dibuat (klik Run / cron) | Worker | D1 `runs` (`status=queued`) |
| Job Actions mulai | Cloud reporter → `POST /api/runner/events` `run.started` | D1 `runs` (`status=running`, `github_run_id`) |
| Tiap langkah test | Reporter → `PUT /api/runner/artifacts/...` lalu event `step` | R2 screenshot, D1 `steps` |
| Tiap baris log | Reporter → event `log` (dikirim per batch ±1 detik) | D1 `run_logs` |
| Test selesai | Reporter → upload video mp4 + `network.json`, lalu event `test.end` | R2 file, D1 `test_results` |
| Run selesai | Reporter → event `run.finished` | D1 `runs` (ringkasan) |
| Tiap hari | Cron Worker | Hapus file R2 + baris D1 run > 30 hari (kecuali `pinned`) |

Runner tidak memegang kredensial Cloudflare. Ia hanya tahu URL Worker dan `RUNNER_TOKEN`; semua tulis ke D1/R2 dilakukan Worker.

Key R2: `runs/{runId}/{testId}/step-{nn}.png`, `.../video.mp4`, `.../network.json`, `runs/{runId}/report.json`.

---

## 9. Event runner ↔ Worker

Format mengikuti event socket Automation Newsroom (PRD referensi §9) supaya komponen UI bisa dipakai ulang.

| Event | Payload |
| --- | --- |
| `run.started` | `runId`, `githubRunId`, `githubRunUrl`, `total` |
| `test.begin` | `runId`, `testId`, `tcId`, `title`, `file` |
| `step` | `runId`, `testId`, `index`, `label`, `screenshotKey` |
| `log` | `runId`, `seq`, `level`, `message` |
| `test.end` | `runId`, `testId`, `status`, `durationMs`, `error`, `videoKey`, `networkKey` |
| `run.finished` | `runId`, `status`, `passed`, `failed`, `skipped`, `durationMs` |

Endpoint:

| Method | Path | Auth |
| --- | --- | --- |
| `POST` | `/api/runs` | Turnstile (publik) / session owner |
| `GET` | `/api/runs?project=` | Publik |
| `GET` | `/api/runs/:id` | Publik (run + test + steps) |
| `GET` | `/api/runs/:id/live` | Publik, upgrade WebSocket ke `RunChannel` |
| `GET` | `/api/artifacts/*` | Publik, stream dari R2 |
| `POST` | `/api/runner/events` | `RUNNER_TOKEN` |
| `PUT` | `/api/runner/artifacts/*` | `RUNNER_TOKEN` |
| `POST` | `/api/runs/:id/cancel` | Owner |
| `POST` | `/api/auth/login` | Publik (dengan lockout) |
| `POST` | `/api/auth/logout` | Owner |
| `GET` | `/api/auth/me` | Owner |

---

## 10. Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-01 | Halaman portofolio (tanpa Lab) LCP < 2,5 detik di 4G. |
| NFR-02 | Event dari runner tampil di browser < 2 detik setelah dikirim. |
| NFR-03 | Penonton yang masuk di tengah run melihat semua event sebelumnya (dari D1), lalu lanjut live. |
| NFR-04 | Biaya: tetap di free tier Cloudflare dan GitHub Actions (repo publik) untuk pemakaian normal. |
| NFR-05 | Responsif sampai lebar 360 px. Tab Langkah tetap bisa dipakai di HP. |
| NFR-06 | Light/dark, mengikuti preferensi sistem. |
| NFR-07 | Bahasa: Inggris (utama) dan Indonesia. |
| NFR-08 | Test Tools from Eiklab stabil: flaky rate < 5% dalam 30 hari. |

---

## 11. Milestone

| Fase | Hasil | Selesai bila |
| --- | --- | --- |
| **M1 — Portofolio statis** | Home, About, Projects, Contact di frontend Worker; `ci.yml`, `deploy-frontend.yml`, `deploy-backend.yml` | Live di `*.workers.dev`, PR dicek CI, deploy otomatis dari `main` |
| **M2 — Suite Tools from Eiklab** | `automation/tools` dengan suite `smoke` & `sanity`, jalan di Actions (manual dispatch), artifact sebagai GitHub artifact | Run hijau 5× berturut-turut |
| **M3 — Hasil ke D1 + R2** | Cloud reporter, API runner, halaman replay run | Run dari Actions bisa dibuka di `/lab/tools/runs/:id` |
| **M4 — Live** | Durable Object `RunChannel`, tombol Run publik, Turnstile, rate limit, watchdog cron | Pengunjung memicu run dan melihat log/langkah muncul live |
| **M5 — Riwayat & jadwal** | Run terjadwal harian, dashboard pass rate, admin owner, suite `full` | Grafik 30 hari terisi |
| **M6 — Project berikutnya** | Automation Jastip / Undangan | Opsional |

---

## 12. Risiko

| Risiko | Mitigasi |
| --- | --- |
| Runner GitHub lambat mulai (30–90 detik), terasa "tidak live" | Tampilkan status `queued` dengan penjelasan + tampilkan replay run terakhir sambil menunggu. Cache browser Playwright di workflow. |
| Test menjalankan aksi di staging Tools from Eiklab | Akun test khusus, prefix `[QA-BOT]`, cleanup wajib, tidak ada flow admin/AI. |
| Penyalahgunaan tombol Run | §7: Turnstile, kuota, 1 run aktif, tombol bisa dimatikan owner. |
| Repo publik → kode dan riwayat workflow bisa dibaca siapa pun | Secret hanya di GitHub Secrets / Worker secret; log reporter tidak mencetak kredensial (SEC-06); `e2e` tidak jalan untuk PR dari fork (SEC-08). |
| Bug di test bisa merusak data staging Tools from Eiklab | Akun bot khusus, prefix `[QA-BOT]`, cleanup wajib, suite publik tidak berisi aksi destruktif di luar data bot. |
| Perubahan UI Tools from Eiklab memecah test | `data-testid` ditambahkan di Tools from Eiklab + locator terpusat. Run terjadwal mendeteksi lebih awal. |
| Video `.webm` tidak jalan di Safari | Konversi ke mp4 dengan ffmpeg di runner sebelum upload. |

---

## 13. Pertanyaan terbuka

Tidak ada.

### Sudah diputuskan

| Topik | Keputusan | Tanggal |
| --- | --- | --- |
| Visibilitas repo | Repo portofolio **publik**: menit GitHub Actions gratis, kode test bisa ditunjukkan ke interviewer. Konsekuensi: tidak ada secret, URL internal, atau kredensial di kode; semua lewat GitHub Secrets / Worker secret | 2026-10-24 |
| `data-testid` | Boleh ditambahkan di repo Tools from Eiklab. Locator test memprioritaskan `getByTestId`, lalu role/label | 2026-10-24 |
| Environment target | Test ke staging `https://staging-tools.eiklab.com`, tidak pernah ke production. Tetap memakai akun bot dan aturan test data §6 | 2026-10-30 |
| Domain | Frontend di `kei-portfolio.eiklab.com` (custom domain Worker); `*.workers.dev` redirect 301 ke domain ini | 2026-10-30 |
| Login | Hanya untuk owner (§4.4), tanpa registrasi | 2026-10-24 |
| Penyimpanan hasil run | Tiap run Actions otomatis tersimpan ke D1 + R2 lewat Worker (§8.1) | 2026-10-24 |
