import type { Localized } from '@kei/shared';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang } from './utils';

const en = {
  nav: { about: 'About', experience: 'Experience', projects: 'Projects', lab: 'QA Lab', contact: 'Contact', hire: "Let's talk" },
  hero: {
    status: 'Senior QA Engineer at',
    hi: "Hi, I'm Kei.",
    cta: { contact: 'Get in touch', lab: 'Watch my tests run', cv: 'Download CV' },
    based: 'Based in',
    passRate: 'latest run',
  },
  terminal: { title: 'kei.spec.ts', running: 'Running 6 tests using 1 worker', passed: 'passed', ready: 'Ready for your team.' },
  stats: {
    yrs: '+ yrs',
    qa: 'in Quality Assurance',
    roles: 'QA roles, 2 companies',
    products: 'products built & shipped solo',
    e2e: 'E2E flows automated on production',
  },
  about: {
    eyebrow: 'About',
    title: 'Quality is a feature. I make sure it ships.',
    bring: 'What I bring to your team',
  },
  experience: { eyebrow: 'Experience', title: 'Where I have been breaking things', present: 'Present' },
  skills: {
    eyebrow: 'Skills',
    title: 'Tools I trust in production',
    work: 'Used daily at work',
    personal: 'From my own projects',
  },
  projects: {
    eyebrow: 'Projects',
    title: 'I build products, so I know where they break',
    subtitle: 'Three live apps I designed, built, and deployed end to end. One of them is already covered by automation you can inspect.',
    automated: 'Automated with Playwright',
    notYet: 'Automation coming',
    visit: 'Visit live site',
    caseStudy: 'Read QA case study',
    details: 'View details',
  },
  lab: {
    eyebrow: 'QA Lab',
    title: "Don't take my word for it. Watch the tests run.",
    subtitle: 'Real Playwright tests against my production app HelpMyCV: step-by-step screenshots, video, and a report, recorded on every run.',
    latest: 'Latest run',
    local: 'local run',
    open: 'Open QA Lab',
    soon: 'Live runner on GitHub Actions: coming soon',
    passed: 'passed',
    duration: 'Duration',
    steps: 'Recorded steps',
  },
  education: { eyebrow: 'Education & certifications', title: 'Foundations', gpa: 'GPA' },
  contact: {
    eyebrow: 'Contact',
    title: "Let's ship quality together.",
    subtitle: 'Hiring for QA or test automation? Drop me a line and let\'s talk about your product.',
    email: 'Email me',
    copy: 'Copy email',
    copied: 'Copied!',
  },
  footer: { built: 'Built with React, Vite and Cloudflare Workers. Tested with Playwright, obviously.' },
  project: {
    back: 'All projects',
    overview: 'Overview',
    features: 'Key features',
    stack: 'Tech stack',
    strategy: 'Test strategy',
    automated: 'What I automated, and why',
    notAutomated: 'What I deliberately did not automate',
    findings: 'Bugs & risks found',
    noAutomation: 'Automation for this project is planned. The case study will appear here once the suite is live.',
  },
  labPage: {
    how: 'How it works',
    flow: [
      { title: 'You press Run', body: 'Turnstile and a rate limit protect the button. One run at a time.' },
      { title: 'GitHub Actions spins up', body: 'A real Linux VM installs Chromium and runs the Playwright suite.' },
      { title: 'Results stream back', body: 'Steps, logs, screenshots and video are stored in Cloudflare D1 and R2.' },
      { title: 'You watch it live', body: 'Every step appears here within seconds, and any run can be replayed later.' },
    ],
    report: 'Test report',
    status: 'Status',
    test: 'Test case',
  },
  notFound: { title: 'Test failed: page not found', body: "This route doesn't exist. Even my tests couldn't find it.", home: 'Back to home' },
};

type Dict = typeof en;

const id: Dict = {
  nav: { about: 'Tentang', experience: 'Pengalaman', projects: 'Project', lab: 'QA Lab', contact: 'Kontak', hire: 'Hubungi saya' },
  hero: {
    status: 'Senior QA Engineer di',
    hi: 'Halo, saya Kei.',
    cta: { contact: 'Hubungi saya', lab: 'Lihat test saya berjalan', cv: 'Unduh CV' },
    based: 'Berdomisili di',
    passRate: 'run terakhir',
  },
  terminal: { title: 'kei.spec.ts', running: 'Menjalankan 6 test dengan 1 worker', passed: 'lolos', ready: 'Siap bergabung dengan tim Anda.' },
  stats: {
    yrs: '+ thn',
    qa: 'di Quality Assurance',
    roles: 'role QA, 2 perusahaan',
    products: 'produk dibangun & dirilis sendiri',
    e2e: 'alur E2E terotomasi di production',
  },
  about: {
    eyebrow: 'Tentang',
    title: 'Kualitas adalah fitur. Saya pastikan ikut rilis.',
    bring: 'Yang saya bawa ke tim Anda',
  },
  experience: { eyebrow: 'Pengalaman', title: 'Tempat saya mencari celah', present: 'Sekarang' },
  skills: {
    eyebrow: 'Skill',
    title: 'Tools yang saya percaya di production',
    work: 'Dipakai sehari-hari di kantor',
    personal: 'Dari project pribadi',
  },
  projects: {
    eyebrow: 'Project',
    title: 'Saya membangun produk, jadi saya tahu di mana ia rusak',
    subtitle: 'Tiga aplikasi live yang saya rancang, bangun, dan deploy sendiri. Salah satunya sudah dicakup automation yang bisa Anda periksa.',
    automated: 'Terotomasi dengan Playwright',
    notYet: 'Automation menyusul',
    visit: 'Buka situs live',
    caseStudy: 'Baca studi kasus QA',
    details: 'Lihat detail',
  },
  lab: {
    eyebrow: 'QA Lab',
    title: 'Jangan percaya kata saya. Lihat test-nya berjalan.',
    subtitle: 'Test Playwright sungguhan terhadap aplikasi production saya, HelpMyCV: screenshot per langkah, video, dan report, direkam di setiap run.',
    latest: 'Run terakhir',
    local: 'run lokal',
    open: 'Buka QA Lab',
    soon: 'Runner live di GitHub Actions: segera hadir',
    passed: 'lolos',
    duration: 'Durasi',
    steps: 'Langkah yang direkam',
  },
  education: { eyebrow: 'Pendidikan & sertifikasi', title: 'Fondasi', gpa: 'IPK' },
  contact: {
    eyebrow: 'Kontak',
    title: 'Mari rilis produk berkualitas bersama.',
    subtitle: 'Sedang mencari QA atau test automation? Kirim pesan dan mari bicara soal produk Anda.',
    email: 'Kirim email',
    copy: 'Salin email',
    copied: 'Tersalin!',
  },
  footer: { built: 'Dibangun dengan React, Vite, dan Cloudflare Workers. Dites dengan Playwright, tentu saja.' },
  project: {
    back: 'Semua project',
    overview: 'Ringkasan',
    features: 'Fitur utama',
    stack: 'Tech stack',
    strategy: 'Strategi test',
    automated: 'Yang saya otomasi, dan alasannya',
    notAutomated: 'Yang sengaja tidak saya otomasi',
    findings: 'Bug & risiko yang ditemukan',
    noAutomation: 'Automation untuk project ini sedang direncanakan. Studi kasusnya akan muncul di sini setelah suite-nya live.',
  },
  labPage: {
    how: 'Cara kerjanya',
    flow: [
      { title: 'Anda menekan Run', body: 'Tombol dilindungi Turnstile dan rate limit. Satu run dalam satu waktu.' },
      { title: 'GitHub Actions menyala', body: 'VM Linux sungguhan memasang Chromium dan menjalankan suite Playwright.' },
      { title: 'Hasil dikirim balik', body: 'Langkah, log, screenshot, dan video disimpan di Cloudflare D1 dan R2.' },
      { title: 'Anda menonton live', body: 'Tiap langkah muncul di sini dalam hitungan detik, dan run lama bisa diputar ulang.' },
    ],
    report: 'Report test',
    status: 'Status',
    test: 'Test case',
  },
  notFound: { title: 'Test gagal: halaman tidak ditemukan', body: 'Route ini tidak ada. Bahkan test saya tidak menemukannya.', home: 'Kembali ke beranda' },
};

const DICTS: Record<Lang, Dict> = { en, id };

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  ui: Dict;
  t: (text: Localized) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'id') return saved;
  } catch {
    // localStorage bisa diblokir; pakai bahasa browser.
  }
  return navigator.language.toLowerCase().startsWith('id') ? 'id' : 'en';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang: (next) => {
        setLangState(next);
        try {
          localStorage.setItem('lang', next);
        } catch {
          // abaikan
        }
      },
      ui: DICTS[lang],
      t: (text) => text[lang],
    }),
    [lang]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}
