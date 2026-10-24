# HelpMyCV Automation

End-to-end test Playwright + TypeScript untuk [HelpMyCV](https://helpmycv-frontend.keianggoro12.workers.dev/) (Kei With Tools). Polanya sama dengan Automation Newsroom (`automation-frontend-single-brand`): Page Object Model, screenshot per langkah, video, network log, dan HTML report.

## Cakupan

| TC ID | Spec | Skenario |
| --- | --- | --- |
| AUT-01-01 | `tests/auth/01-register.spec.ts` | Pengunjung mendaftar akun baru lalu masuk ke dashboard |
| AUT-02-01 | `tests/auth/02-login.spec.ts` | User terdaftar login lalu masuk ke dashboard |
| RES-01-01 | `tests/resume/01-create-resume.spec.ts` | User membuat CV (template, nama), mengisi semua section, menyimpan; isi bertahan setelah reload dan CV muncul di daftar |
| RES-02-01 | `tests/resume/02-edit-resume.spec.ts` | User membuka CV berisi data lama, menimpa semua section, menyimpan; isi baru bertahan setelah reload |
| RES-03-01 | `tests/resume/03-delete-resume.spec.ts` | User menghapus CV dan CV hilang dari daftar dan API |

TC ID dibuat otomatis oleh `reporters/step-reporter.ts`: `<3 huruf folder>-<nomor spec>-<nomor test>`.

## Menjalankan

```bash
npm install
npx playwright install chromium
npm test                 # semua test
npm run test:auth        # register + login
npm run test:resume      # create, edit, delete CV
npm run report           # buka HTML report
```

`.env` opsional (lihat `.env.example`). Tanpa `.env`, test berjalan ke production HelpMyCV dengan isi CV dummy.

## Isi CV dari Gemini

Create dan edit memakai method yang sama, `fillResumeContent()` di `helpers/resume.helper.ts`, lalu `expectResumeContent()` memuat ulang editor dan membandingkan semua field.

- `utils/ai-generator.ts` meminta Gemini menulis satu CV fiktif utuh (profesi diacak). Daftar model dicoba berurutan; model yang mati atau kena rate limit dilewati, seperti di Automation Newsroom.
- Section yang diisi: Personal Information, Education (1), Experience (2), Skills (5), Projects (2), Achievements & Other (1), Certifications (2). Tiap entri yang punya bullet diisi 3 bullet. Jumlahnya diatur di `ENTRY_LIMITS` (`utils/resume-content.ts`).
- Tanggal, email, nomor HP, dan URL dibuat lokal: tanggal disusun mundur dari bulan ini tanpa tumpang tindih, URL selalu `example.com`.
- Tanpa `GEMINI_API_KEY`, `AI_MODE=off`, atau Gemini gagal dalam 40 detik: test tetap jalan dengan data dummy faker. Sumber konten tercetak di log (`Resume content source: ai (<model>)` / `dummy`).
- Gemini dipanggil paralel dengan login, jadi biasanya tidak menambah durasi test.

## Test data

- Tidak ada kredensial yang disimpan. Tiap run mendaftarkan akun bot baru lewat API (`fixtures/test.ts`, fixture `account`), dengan password acak.
- Semua data diberi prefix `[QA-BOT]`. Email memakai domain `example.com`, jadi tidak ada email yang terkirim.
- Tiap test berdiri sendiri: edit dan delete menyiapkan CV lewat API, lalu `afterEach` menghapus CV yang dibuat test.
- HelpMyCV belum punya endpoint hapus akun, jadi akun bot tetap tersimpan setelah run.

## Hasil run

| Hasil | Lokasi |
| --- | --- |
| Screenshot per langkah + `network.json` | `test-results/<spec>__<test>-steps/` |
| Video | `test-results/<test>/video.webm` |
| Trace (hanya saat gagal) | `test-results/<test>/trace.zip` |
| HTML report | `playwright-report/index.html` |
| Log langkah (`[TEST-START]`, `[STEP]`, `[STEP-SHOTS]`, …) | stdout |

Password diisi lewat `utils/secret.ts`, bukan `fill()`, supaya nilainya tidak tercatat di judul step, log, dan report. Body request di `network.json` juga disensor (password, token).

## Struktur

```
fixtures/   test.ts (account bot, api, efek klik), network.ts (rekam request)
locators/   label dan nama elemen per halaman
pages/      Page Object: auth, dashboard, resume-list, resume-editor
helpers/    alur bisnis berisi test.step + snap; api.helper.ts untuk setup/cleanup
reporters/  step-reporter.ts
tests/      auth/, resume/
utils/      ai-generator (Gemini), resume-content (model data + dummy), snap, secret, data-generator, click-effect, timeout
```
