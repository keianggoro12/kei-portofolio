import fs from 'fs';
import path from 'path';
import type { TestCase, TestStep } from '@playwright/test/reporter';

// Dipakai bersama oleh step-reporter (stdout) dan cloud-reporter (QA Lab).

export const SHOWN_CATEGORIES = new Set(['pw:api', 'test.step', 'expect']);
export const HIDDEN_METHODS = ['__waitInfo__', '__waitForEventInfo', 'Wait for load state'];

// Baris test (`test(` / `test.skip(` ...) per file, dipakai untuk nomor urut TC.
// Dibaca dari file, bukan dari suite yang terfilter, supaya TC ID tidak berubah
// ketika hanya sebagian test yang dijalankan.
const caseLineCache = new Map<string, number[]>();

function caseLines(file: string): number[] {
  let lines = caseLineCache.get(file);
  if (!lines) {
    lines = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      // Hanya deklarasi test berjudul: test('…'), test.skip('…'), dst. — bukan test.describe/setTimeout/step.
      .flatMap((text, i) => (/^\s*test(\.(only|skip|fixme|fail))?\(\s*[`'"]/.test(text) ? [i + 1] : []));
    caseLineCache.set(file, lines);
  }
  return lines;
}

// Format: <MODUL 3 huruf>-<nomor spec>-<nomor case>, contoh HAR-01-02.
// Run ulang loop (RUN_COUNT > 1) diberi suffix -R2, -R3, dst.
export function tcId(test: TestCase, run: number): string {
  const file = test.location.file;
  const moduleCode = path.basename(path.dirname(file)).slice(0, 3).toUpperCase();
  const specNo = path.basename(file).match(/^(\d+)-/)?.[1] ?? '00';
  const caseNo = caseLines(file).indexOf(test.location.line) + 1;
  const runSuffix = run > 1 ? `-R${run}` : '';
  return `${moduleCode}-${specNo}-${String(caseNo).padStart(2, '0')}${runSuffix}`;
}

export function normalizeStatus(status: string): string {
  if (status === 'passed') return 'passed';
  if (status === 'failed' || status === 'timedOut' || status === 'interrupted') return 'failed';
  return 'skipped';
}

export function depth(step: TestStep): number {
  let level = 1;
  let parent = step.parent;
  while (parent) {
    level += 1;
    parent = parent.parent;
  }
  return level;
}
