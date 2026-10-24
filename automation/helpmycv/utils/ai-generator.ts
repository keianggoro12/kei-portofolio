import {
  buildResumeContent,
  dummyResumeText,
  ENTRY_LIMITS,
  pickProfession,
  type GeneratedText,
  type ResumeContent,
} from './resume-content';

// Pola sama dengan Automation Newsroom (utils/ai-generator.ts): daftar model
// dicoba berurutan, model yang mati/rate limit dilewati, dan bila Gemini tidak
// tersedia test tetap jalan dengan data dummy faker.
const API_KEY = process.env.GEMINI_API_KEY || '';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
// AI_MODE=off → langsung pakai data dummy.
const AI_ENABLED = (process.env.AI_MODE || 'on').trim().toLowerCase() !== 'off';

// Model yang terbukti jalan dicoba dulu supaya run tidak membuang waktu.
const RELIABLE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
];
const EXCLUDE_MODEL =
  /embedding|image|tts|transcribe|robotics|computer-use|lyria|deep-research|antigravity|aqa|nano-banana|omni|clip|customtools/i;

// CV utuh lebih panjang dari konten Newsroom, jadi tiap percobaan diberi waktu lebih.
const BUDGET = { total: 40000, attempts: 3, perAttempt: 25000 };
const LIST_TIMEOUT = 5000;
const RATE_LIMIT_COOLDOWN = 60000;

const STRING = { type: 'STRING' };
const BULLETS = { type: 'ARRAY', items: STRING };
const obj = (properties: Record<string, unknown>) => ({
  type: 'OBJECT',
  properties,
  required: Object.keys(properties),
});
const list = (properties: Record<string, unknown>) => ({ type: 'ARRAY', items: obj(properties) });

const RESUME_SCHEMA = obj({
  personal: obj({ fullName: STRING, role: STRING, address: STRING, summary: STRING }),
  education: list({ institution: STRING, location: STRING, degree: STRING, gpa: STRING, bullets: BULLETS }),
  experience: list({ company: STRING, jobTitle: STRING, location: STRING, employmentType: STRING, bullets: BULLETS }),
  skills: list({ name: STRING, level: STRING }),
  projects: list({ name: STRING, url: STRING, bullets: BULLETS }),
  achievements: list({ title: STRING, organization: STRING, url: STRING, bullets: BULLETS }),
  certifications: list({ name: STRING, issuer: STRING, url: STRING }),
});

let cachedModels: string[] | null = null;
let preferredModel: string | null = null;
const deadModels = new Set<string>();
const coolingUntil = new Map<string, number>();

function isUsableModel(name: string): boolean {
  return !!name && !EXCLUDE_MODEL.test(name) && !deadModels.has(name);
}

async function listModels(): Promise<string[]> {
  if (cachedModels) return cachedModels;
  try {
    const res = await fetch(`${API_BASE}/models`, {
      headers: { 'x-goog-api-key': API_KEY },
      signal: AbortSignal.timeout(LIST_TIMEOUT),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { models?: Array<{ name?: string; supportedGenerationMethods?: string[] }> };
    const models = (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => String(m.name || '').replace(/^models\//, ''))
      .filter(isUsableModel);
    cachedModels = models.length ? models : RELIABLE_MODELS;
  } catch {
    cachedModels = RELIABLE_MODELS;
  }
  return cachedModels;
}

function prioritizeModels(models: string[]): string[] {
  const ordered = [...new Set([preferredModel, ...RELIABLE_MODELS, ...models])].filter(
    (name): name is string => !!name && models.includes(name) && isUsableModel(name)
  );
  const now = Date.now();
  const ready = ordered.filter((name) => (coolingUntil.get(name) ?? 0) <= now);
  return ready.length ? ready : ordered;
}

function buildPrompt(profession: string): string {
  const { education, experience, skills, projects, achievements, certifications, bullets } = ENTRY_LIMITS;
  return [
    'You generate test data for a CV builder app.',
    `Write ONE realistic but FICTIONAL CV (not a real person) for a ${profession} based in Indonesia, in English.`,
    'Reply ONLY with JSON matching the schema.',
    'Rules:',
    '- personal.fullName: a plausible Indonesian full name, 2-3 words.',
    `- personal.role: the job title, close to "${profession}".`,
    '- personal.address: "<city>, Indonesia".',
    '- personal.summary: 2-3 sentences, max 300 characters.',
    `- education: exactly ${education} item(s). gpa like "3.65/4.00".`,
    `- experience: exactly ${experience} items, most recent first, fictional company names. employmentType one of "Full-time", "Contract", "Freelance", "Internship".`,
    `- skills: exactly ${skills} items relevant to the role. level one of "Beginner", "Intermediate", "Advanced", "Expert".`,
    `- projects: exactly ${projects} items with short product-like names.`,
    `- achievements: exactly ${achievements} item(s).`,
    `- certifications: exactly ${certifications} items.`,
    `- every bullets array: exactly ${bullets} achievement-oriented bullets, each 6-16 words, no trailing period.`,
    '- every url: https://example.com/<short-slug> (never a real domain).',
    '- Plain text only: no markdown, no emoji, no line breaks inside values.',
  ].join('\n');
}

async function callModel(model: string, prompt: string, timeout: number): Promise<unknown> {
  const res = await fetch(`${API_BASE}/models/${model}:generateContent`, {
    method: 'POST',
    // Key di header, bukan query string, supaya tidak ikut tercetak di pesan error/log.
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: RESUME_SCHEMA, temperature: 1.2 },
    }),
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let status = '';
    try {
      status = (JSON.parse(body) as { error?: { status?: string } }).error?.status || '';
    } catch {
      status = body.replace(/\s+/g, ' ').slice(0, 80);
    }
    throw new Error(`HTTP ${res.status} ${status}`.trim());
  }
  const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return JSON.parse(data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '');
}

function cleanLine(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

/** Ambil `limit` item pertama yang semua field teksnya terisi. */
function cleanItems<K extends string>(value: unknown, keys: readonly K[], limit: number, withBullets: boolean) {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      const source = (raw || {}) as Record<string, unknown>;
      const item = Object.fromEntries(keys.map((k) => [k, cleanLine(source[k])])) as Record<K, string>;
      const bullets = Array.isArray(source.bullets)
        ? source.bullets.map(cleanLine).filter(Boolean).slice(0, ENTRY_LIMITS.bullets)
        : [];
      return { item, bullets };
    })
    .filter(({ item, bullets }) => keys.every((k) => item[k]) && (!withBullets || bullets.length > 0))
    .slice(0, limit)
    .map(({ item, bullets }) => (withBullets ? { ...item, bullets } : item));
}

function sanitize(raw: unknown): GeneratedText | null {
  const source = (raw || {}) as Record<string, unknown>;
  const personalRaw = (source.personal || {}) as Record<string, unknown>;
  const personal = {
    fullName: cleanLine(personalRaw.fullName),
    role: cleanLine(personalRaw.role),
    address: cleanLine(personalRaw.address),
    summary: cleanLine(personalRaw.summary),
  };
  const text = {
    personal,
    education: cleanItems(source.education, ['institution', 'location', 'degree', 'gpa'], ENTRY_LIMITS.education, true),
    experience: cleanItems(source.experience, ['company', 'jobTitle', 'location', 'employmentType'], ENTRY_LIMITS.experience, true),
    skills: cleanItems(source.skills, ['name', 'level'], ENTRY_LIMITS.skills, false),
    projects: cleanItems(source.projects, ['name', 'url'], ENTRY_LIMITS.projects, true),
    achievements: cleanItems(source.achievements, ['title', 'organization', 'url'], ENTRY_LIMITS.achievements, true),
    certifications: cleanItems(source.certifications, ['name', 'issuer', 'url'], ENTRY_LIMITS.certifications, false),
  } as GeneratedText;
  // Tiap section wajib terisi minimal satu entri; bila tidak, coba model lain.
  const complete =
    Object.values(personal).every(Boolean) &&
    (['education', 'experience', 'skills', 'projects', 'achievements', 'certifications'] as const).every(
      (key) => text[key].length > 0
    );
  return complete ? text : null;
}

async function generateText(profession: string): Promise<{ text: GeneratedText; model: string } | null> {
  const ordered = prioritizeModels(await listModels());
  const deadline = Date.now() + BUDGET.total;
  const prompt = buildPrompt(profession);

  for (let attempt = 0; attempt < BUDGET.attempts && attempt < ordered.length; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      console.log('[AI] time budget exceeded for resume content');
      break;
    }
    const model = ordered[attempt];
    try {
      const text = sanitize(await callModel(model, prompt, Math.min(BUDGET.perAttempt, remaining)));
      if (text) {
        preferredModel = model;
        return { text, model };
      }
      console.log(`[AI] ${model} returned incomplete resume content, trying another model`);
    } catch (err) {
      const message = (err as Error).message;
      if (/\b404\b|not found|no longer available|not supported/i.test(message)) deadModels.add(model);
      if (/\b429\b/.test(message)) coolingUntil.set(model, Date.now() + RATE_LIMIT_COOLDOWN);
      console.log(`[AI] ${model} failed: ${message}`);
    }
  }
  return null;
}

/**
 * Isi CV lengkap (semua section) untuk create maupun edit.
 * Gemini menulis teksnya; tanggal, email, dan nomor HP dibuat lokal.
 */
export async function generateResumeContent(): Promise<ResumeContent> {
  const profession = pickProfession();
  if (!AI_ENABLED) {
    console.log('[AI] AI_MODE=off, resume content memakai data dummy');
  } else if (!API_KEY) {
    console.log('[AI] GEMINI_API_KEY not set, using local dummy data');
  } else {
    const result = await generateText(profession);
    if (result) {
      console.log(`[AI] resume content (${profession}) generated via ${result.model}`);
      return buildResumeContent(result.text, 'ai', result.model);
    }
    console.log('[AI] Gemini tidak tersedia untuk resume content, memakai data dummy');
  }
  return buildResumeContent(dummyResumeText(profession), 'dummy');
}
