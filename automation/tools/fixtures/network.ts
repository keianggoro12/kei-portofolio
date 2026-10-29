import fs from 'fs';
import path from 'path';
import { test as base, type Request } from '@playwright/test';
import { stepsDirName } from '../utils/steps-dir';

export * from '@playwright/test';

// Satu baris di tab Network (UI). Waktu dalam ms relatif terhadap awal test.
export interface NetworkEntry {
  method: string;
  url: string;
  resourceType: string;
  status?: number;
  statusText?: string;
  failure?: string;
  contentType?: string;
  startedAt: number;
  duration?: number;
  size?: number;
  requestBody?: string;
  responseBody?: string;
}

// Body hanya disimpan untuk request API (xhr/fetch), dipotong agar file tetap kecil.
const BODY_TYPES = new Set(['xhr', 'fetch']);
const MAX_REQUEST_BODY = 2000;
const MAX_RESPONSE_BODY = 4000;
// Batas menunggu body yang masih dibaca saat test selesai.
const FLUSH_TIMEOUT = 3000;

// Sensor nilai rahasia (token, password, secret) di body JSON maupun form-encoded.
const SECRET_KEY = '[\\w-]*(?:password|token|secret|authorization|api[_-]?key)[\\w-]*';
const SECRET_JSON = new RegExp(`("${SECRET_KEY}"\\s*:\\s*)"[^"]*"`, 'gi');
const SECRET_FORM = new RegExp(`((?:^|&)${SECRET_KEY}=)[^&]*`, 'gi');

function redact(text: string): string {
  return text.replace(SECRET_JSON, '$1"***"').replace(SECRET_FORM, '$1***');
}

function clip(raw: string | null | undefined, max: number): string | undefined {
  if (!raw) return undefined;
  const text = redact(raw);
  return text.length > max ? `${text.slice(0, max)}… (${text.length - max} karakter dipotong)` : text;
}

async function toEntry(request: Request, testStart: number, failure?: string): Promise<NetworkEntry> {
  const timing = request.timing();
  const startedAt = Math.max(0, Math.round(timing.startTime - testStart));
  const entry: NetworkEntry = {
    method: request.method(),
    url: request.url(),
    resourceType: request.resourceType(),
    startedAt,
    duration: timing.responseEnd >= 0 ? Math.round(timing.responseEnd) : undefined,
    failure,
  };
  const response = await request.response().catch(() => null);
  if (response) {
    entry.status = response.status();
    entry.statusText = response.statusText();
    entry.contentType = response.headers()['content-type'];
    entry.size = (await request.sizes().catch(() => null))?.responseBodySize;
  }
  if (BODY_TYPES.has(entry.resourceType)) {
    entry.requestBody = clip(request.postData(), MAX_REQUEST_BODY);
    if (response) entry.responseBody = clip(await response.text().catch(() => ''), MAX_RESPONSE_BODY);
  }
  return entry;
}

// Host cocok bila sama persis dengan suffix atau subdomain-nya (mis. statik.tempo.co untuk tempo.co).
function matchesHost(url: string, suffix: string): boolean {
  const host = new URL(url).hostname;
  return host === suffix || host.endsWith(`.${suffix}`);
}

export const test = base.extend<{ networkLog: void; networkHostSuffix: string | undefined }>({
  // Bila diisi lewat test.use, hanya request ke domain ini (dan subdomain-nya) yang direkam.
  networkHostSuffix: [undefined, { option: true }],


  // Rekam semua request tiap test ke network.json di folder screenshot langkah test itu,
  // supaya runner mengaitkannya ke test yang sama (lihat stepsDirName).
  networkLog: [
    async ({ context, networkHostSuffix }, use, testInfo) => {
      const testStart = Date.now();
      const entries: NetworkEntry[] = [];
      const pending = new Set<Promise<void>>();
      const record = (request: Request, failure?: string) => {
        if (request.url().startsWith('data:')) return;
        if (networkHostSuffix && !matchesHost(request.url(), networkHostSuffix)) return;
        const job = toEntry(request, testStart, failure)
          .then((entry) => void entries.push(entry))
          .catch(() => undefined);
        pending.add(job);
        void job.finally(() => pending.delete(job));
      };
      const onFinished = (request: Request) => record(request);
      const onFailed = (request: Request) => record(request, request.failure()?.errorText || 'failed');
      context.on('requestfinished', onFinished);
      context.on('requestfailed', onFailed);

      await use();

      context.off('requestfinished', onFinished);
      context.off('requestfailed', onFailed);
      await Promise.race([
        Promise.allSettled([...pending]),
        new Promise((resolve) => setTimeout(resolve, FLUSH_TIMEOUT)),
      ]);
      if (entries.length === 0) return;

      entries.sort((a, b) => a.startedAt - b.startedAt);
      const dir = path.join(path.dirname(testInfo.outputDir), stepsDirName(testInfo.file, testInfo.title));
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'network.json'), JSON.stringify(entries));
    },
    { auto: true },
  ],
});
