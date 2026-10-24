import fs from 'fs';
import path from 'path';
import { test, type Locator, type Page } from '@playwright/test';
import { slugify, stepsDirName } from './steps-dir';

// Jeda sebelum & sesudah screenshot agar halaman sempat tenang (loading,
// animasi, toast) dan momen screenshot terlihat jelas di video.
const PAUSE_BEFORE_MS = parseInt(process.env.SNAP_PAUSE_BEFORE_MS || '800', 10);
const PAUSE_AFTER_MS = parseInt(process.env.SNAP_PAUSE_AFTER_MS || '400', 10);
const SETTLE_TIMEOUT_MS = 3000;

/**
 * Capture the current page state to disk for the UI runner's "Steps" tab.
 *
 * Playwright deletes the contents of a test's output directory when the test
 * passes, so attachments registered via `testInfo.attach` are not kept for
 * green tests. To keep a durable step gallery we write the PNGs into a sibling
 * `*-steps` directory inside `test-results`, which the runner discovers and
 * serves under `/results`.
 */
/**
 * Pasang/lepas sorotan merah. `outline` tidak digambar Chrome pada <tr>, jadi
 * untuk baris tabel sorotan dipasang per sel (latar tipis + garis tepi).
 * Dijalankan di browser lewat evaluateAll, jadi harus mandiri (tanpa referensi luar).
 */
function applyHighlight(els: Element[], on: boolean): void {
  for (const el of els) {
    const cells = el.tagName === 'TR' ? Array.from(el.children) : [el];
    cells.forEach((cell, i) => {
      const style = (cell as HTMLElement).style;
      if (!on) {
        style.backgroundColor = '';
        style.boxShadow = '';
        return;
      }
      const red = '#d61d23';
      const shadows = [`inset 0 3px 0 ${red}`, `inset 0 -3px 0 ${red}`];
      if (i === 0) shadows.push(`inset 3px 0 0 ${red}`);
      if (i === cells.length - 1) shadows.push(`inset -3px 0 0 ${red}`);
      style.backgroundColor = 'rgba(214, 29, 35, 0.08)';
      style.boxShadow = shadows.join(', ');
    });
  }
}

export async function snap(
  page: Page,
  label: string,
  options: { highlight?: Locator; hide?: Locator } = {}
): Promise<void> {
  try {
    const info = test.info();
    const stepsDir = path.join(path.dirname(info.outputDir), stepsDirName(info.file, info.title));
    const index = fs.existsSync(stepsDir)
      ? fs.readdirSync(stepsDir).filter((f) => f.endsWith('.png')).length + 1
      : 1;
    const name = `step-${String(index).padStart(2, '0')}-${slugify(label) || 'snapshot'}.png`;
    fs.mkdirSync(stepsDir, { recursive: true });

    // Berhenti sejenak: tunggu request selesai (maks 3 dtk) lalu jeda tetap.
    await page.waitForLoadState('networkidle', { timeout: SETTLE_TIMEOUT_MS }).catch(() => undefined);
    // Sorot elemen bukti (mis. baris hasil pencarian) agar jelas di screenshot.
    // Sembunyikan sementara elemen penutup (mis. modal picker) agar bukti terlihat.
    if (options.hide) {
      await options.hide.evaluateAll((els) => els.forEach((el) => ((el as HTMLElement).style.visibility = 'hidden'))).catch(() => undefined);
    }
    if (options.highlight) {
      await options.highlight.first().scrollIntoViewIfNeeded().catch(() => undefined);
      await options.highlight.evaluateAll(applyHighlight, true).catch(() => undefined);
    }
    await page.waitForTimeout(PAUSE_BEFORE_MS);
    await page.screenshot({ path: path.join(stepsDir, name), animations: 'disabled' });
    if (options.highlight) {
      await options.highlight.evaluateAll(applyHighlight, false).catch(() => undefined);
    }
    if (options.hide) {
      await options.hide.evaluateAll((els) => els.forEach((el) => ((el as HTMLElement).style.visibility = ''))).catch(() => undefined);
    }
    // Baru lanjut ke langkah berikutnya setelah screenshot tersimpan.
    await page.waitForTimeout(PAUSE_AFTER_MS);
  } catch (err) {
    console.log(`[snap] skipped "${label}": ${(err as Error).message}`);
  }
}
