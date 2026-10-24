import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Production HelpMyCV (tidak ada staging). Bisa diganti lewat .env.
const baseURL = process.env.BASE_URL || 'https://helpmycv-frontend.keianggoro12.workers.dev';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Production HelpMyCV sesekali membalas 503; di CI satu retry supaya hasilnya
  // tercatat "flaky" (bukan gagal), dan tetap terlihat di report.
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // Tiap test login lewat UI + jeda screenshot per langkah; 30 dtk bawaan terlalu mepet.
  timeout: 90000,
  // cloud-reporter hanya aktif bila BACKEND_URL + RUNNER_TOKEN ada (GitHub Actions).
  reporter: [['./reporters/step-reporter.ts'], ['./reporters/cloud-reporter.ts'], ['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    // UI HelpMyCV mengikuti bahasa browser; dikunci ke Inggris supaya locator stabil.
    locale: 'en-US',
    timezoneId: 'Asia/Jakarta',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    launchOptions: {
      slowMo: 50,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
  ],
});
