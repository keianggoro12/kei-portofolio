import type { Locator } from '@playwright/test';

/**
 * Isi field rahasia (password) tanpa membocorkan nilainya.
 *
 * `locator.fill(value)` mencatat nilai di judul step (`Fill "…"`), yang ikut
 * tercetak di log runner dan HTML report publik (PRD SEC-06). Nilai di sini
 * diset lewat setter native + event `input`, sehingga state React tetap
 * ter-update dan judul step hanya "Evaluate".
 */
export async function fillSecret(locator: Locator, value: string): Promise<void> {
  await locator.click();
  await locator.evaluate((el, secret) => {
    const input = el as HTMLInputElement;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setValue?.call(input, secret);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}
