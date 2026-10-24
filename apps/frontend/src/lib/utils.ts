import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
};

export type Lang = keyof typeof MONTHS;

/** "2024-11" → "Nov 2024" */
export function formatMonth(value: string, lang: Lang): string {
  const [year, month] = value.split('-').map(Number);
  return `${MONTHS[lang][month - 1]} ${year}`;
}

/** Jumlah bulan penuh dari `since` (YYYY-MM) sampai sekarang (atau `until`). */
export function monthsBetween(since: string, until: string | null = null): number {
  const [y1, m1] = since.split('-').map(Number);
  const end = until ? until.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
  return (end[0] - y1) * 12 + (end[1] - m1);
}

/** Lama dalam format "1 yr 8 mo" / "1 thn 8 bln". */
export function formatDuration(months: number, lang: Lang): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const unit = lang === 'en' ? { y: 'yr', m: 'mo' } : { y: 'thn', m: 'bln' };
  return [y && `${y} ${unit.y}`, m && `${m} ${unit.m}`].filter(Boolean).join(' ') || `1 ${unit.m}`;
}
