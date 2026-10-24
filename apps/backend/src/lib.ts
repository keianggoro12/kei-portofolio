export function nowIso(): string {
  return new Date().toISOString();
}

export function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function startOfUtcDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export function newId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Bandingkan token tanpa bocor lewat waktu eksekusi. */
export function safeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  return crypto.subtle.timingSafeEqual(left, right);
}

export function clip(value: unknown, max: number): string | null {
  if (typeof value !== 'string' || value === '') return null;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
