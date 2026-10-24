import path from 'path';

export function slugify(label: string): string {
  return label
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60);
}

/**
 * Nama folder screenshot step untuk satu test, dipakai bersama oleh `snap()`
 * (yang menulis PNG) dan step-reporter (yang mengaitkan folder itu ke test
 * supaya screenshot tampil di kolom Evidence).
 */
export function stepsDirName(specFile: string, testTitle: string): string {
  const specSlug = path
    .relative(process.cwd(), specFile)
    .replace(/\.spec\.ts$/, '')
    .replace(/[\\/]+/g, '-');
  return `${specSlug}__${slugify(testTitle) || 'test'}-steps`;
}
