import { faker } from '@faker-js/faker';
import { QA_PREFIX } from './data-generator';
import { pickRandom, randomInt } from './random';

export interface MonthYear {
  /** 1-12 */
  month: number;
  year: number;
}

export interface ResumeContent {
  personal: {
    fullName: string;
    role: string;
    email: string;
    phone: string;
    address: string;
    portfolioUrl: string;
    summary: string;
  };
  education: { institution: string; location: string; degree: string; gpa: string; start: MonthYear; end: MonthYear; bullets: string[] }[];
  experience: { company: string; jobTitle: string; location: string; employmentType: string; start: MonthYear; end: MonthYear; bullets: string[] }[];
  skills: { name: string; level: string }[];
  projects: { name: string; url: string; start: MonthYear; end: MonthYear; bullets: string[] }[];
  achievements: { title: string; organization: string; url: string; date: MonthYear; bullets: string[] }[];
  certifications: { name: string; issuer: string; url: string; date: MonthYear }[];
  source: 'ai' | 'dummy';
  model?: string;
}

/** Bagian konten yang ditulis Gemini; tanggal, email, dan nomor HP dibuat lokal. */
export type GeneratedText = {
  personal: Pick<ResumeContent['personal'], 'fullName' | 'role' | 'address' | 'summary'>;
  education: Omit<ResumeContent['education'][number], 'start' | 'end'>[];
  experience: Omit<ResumeContent['experience'][number], 'start' | 'end'>[];
  skills: ResumeContent['skills'];
  projects: Omit<ResumeContent['projects'][number], 'start' | 'end'>[];
  achievements: Omit<ResumeContent['achievements'][number], 'date'>[];
  certifications: Omit<ResumeContent['certifications'][number], 'date'>[];
};

// Jumlah entri per section. Cukup untuk membuktikan tiap section terisi tanpa membuat test lama.
export const ENTRY_LIMITS = {
  education: 1,
  experience: 2,
  skills: 5,
  projects: 2,
  achievements: 1,
  certifications: 2,
  bullets: 3,
} as const;

export const PROFESSIONS = [
  'QA Engineer',
  'Frontend Developer',
  'Backend Engineer',
  'Data Analyst',
  'Product Designer',
  'DevOps Engineer',
  'Mobile Developer',
  'Product Manager',
] as const;

export function pickProfession(): string {
  return pickRandom(PROFESSIONS);
}

function monthsAgo(months: number): MonthYear {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - months);
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

function monthsSince({ month, year }: MonthYear): number {
  const now = new Date();
  return (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
}

/** Rentang tanggal mundur dari sekarang: entri pertama paling baru, tidak tumpang tindih. */
function timeline(count: number, gapMonths: [number, number], lengthMonths: [number, number]): { start: MonthYear; end: MonthYear }[] {
  let cursor = randomInt(...gapMonths);
  return Array.from({ length: count }, () => {
    const end = cursor;
    const start = end + randomInt(...lengthMonths);
    cursor = start + randomInt(...gapMonths);
    return { start: monthsAgo(start), end: monthsAgo(end) };
  });
}

/** Gabungkan teks (dari Gemini atau dummy) dengan tanggal dan kontak buatan lokal. */
export function buildResumeContent(text: GeneratedText, source: 'ai' | 'dummy', model?: string): ResumeContent {
  const fullName = text.personal.fullName.startsWith(QA_PREFIX)
    ? text.personal.fullName
    : `${QA_PREFIX} ${text.personal.fullName}`;
  const slug = faker.string.alphanumeric(6).toLowerCase();
  const experienceDates = timeline(text.experience.length, [0, 3], [12, 30]);
  const projectDates = timeline(text.projects.length, [1, 6], [2, 8]);
  // Pendidikan selesai beberapa bulan sebelum pengalaman kerja tertua.
  const careerStart = experienceDates.at(-1)?.start ?? monthsAgo(24);
  const monthsBeforeCareer = monthsSince(careerStart) + randomInt(3, 9);
  return {
    personal: {
      ...text.personal,
      fullName,
      email: `qa-bot+cv${Date.now()}@example.com`,
      phone: `08${faker.string.numeric(10)}`,
      portfolioUrl: `https://example.com/${slug}`,
    },
    education: text.education.map((e) => ({
      ...e,
      start: monthsAgo(monthsBeforeCareer + 48),
      end: monthsAgo(monthsBeforeCareer),
    })),
    experience: text.experience.map((e, i) => ({ ...e, ...experienceDates[i] })),
    skills: text.skills,
    projects: text.projects.map((p, i) => ({ ...p, ...projectDates[i] })),
    achievements: text.achievements.map((a) => ({ ...a, date: monthsAgo(randomInt(3, 36)) })),
    certifications: text.certifications.map((c) => ({ ...c, date: monthsAgo(randomInt(3, 48)) })),
    source,
    model,
  };
}

/** Fallback saat Gemini tidak tersedia / AI_MODE=off. */
export function dummyResumeText(profession: string): GeneratedText {
  const bullets = () => Array.from({ length: ENTRY_LIMITS.bullets }, () => faker.company.catchPhrase());
  const url = () => `https://example.com/${faker.string.alphanumeric(6).toLowerCase()}`;
  return {
    personal: {
      fullName: faker.person.fullName(),
      role: profession,
      address: `${faker.location.city()}, Indonesia`,
      summary: `${profession} with ${randomInt(2, 9)} years of experience. ${faker.lorem.sentences(2)}`,
    },
    education: Array.from({ length: ENTRY_LIMITS.education }, () => ({
      institution: `${faker.location.city()} University`,
      location: `${faker.location.city()}, Indonesia`,
      degree: `Bachelor of ${pickRandom(['Computer Science', 'Information Systems', 'Design', 'Statistics'])}`,
      gpa: `${randomInt(30, 40) / 10}/4.0`,
      bullets: bullets(),
    })),
    experience: Array.from({ length: ENTRY_LIMITS.experience }, () => ({
      company: faker.company.name(),
      jobTitle: profession,
      location: `${faker.location.city()}, Indonesia`,
      employmentType: pickRandom(['Full-time', 'Contract', 'Freelance']),
      bullets: bullets(),
    })),
    skills: Array.from({ length: ENTRY_LIMITS.skills }, () => ({
      name: faker.hacker.noun().replace(/^./, (c) => c.toUpperCase()),
      level: pickRandom(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
    })),
    projects: Array.from({ length: ENTRY_LIMITS.projects }, () => ({
      name: `${faker.commerce.productAdjective()} ${faker.commerce.product()}`,
      url: url(),
      bullets: bullets(),
    })),
    achievements: Array.from({ length: ENTRY_LIMITS.achievements }, () => ({
      title: `${faker.company.buzzAdjective()} Award`.replace(/^./, (c) => c.toUpperCase()),
      organization: faker.company.name(),
      url: url(),
      bullets: bullets(),
    })),
    certifications: Array.from({ length: ENTRY_LIMITS.certifications }, () => ({
      name: `${faker.hacker.adjective()} ${faker.hacker.noun()} Certificate`.replace(/^./, (c) => c.toUpperCase()),
      issuer: faker.company.name(),
      url: url(),
    })),
  };
}
