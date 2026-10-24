/** Teks dwibahasa: Inggris (utama) dan Indonesia (PRD NFR-07). */
export type Localized = { en: string; id: string };

export type SkillLevel = 'Expert' | 'Advanced' | 'Intermediate';

export interface Experience {
  role: string;
  company: string;
  type?: Localized;
  location: string;
  start: string; // YYYY-MM
  end: string | null; // null = sekarang
  highlights: Localized[];
  tags: string[];
}

export interface Skill {
  name: string;
  level: SkillLevel;
  /** Dipakai sehari-hari di kantor, atau dari project pribadi. */
  source: 'work' | 'personal';
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string; // YYYY-MM; kosong bila tidak tercantum di CV
  url: string;
  note?: Localized;
}

// Sumber: Resume Kei Anggoro Publik.pdf (PRD §4.5). Alamat rumah dan nomor
// telepon sengaja tidak ada di sini karena situs dan repo publik.
export const profile = {
  name: 'Juliardi Dwi Anggoro',
  nickname: 'Kei',
  role: 'Senior QA Engineer',
  currentCompany: 'Tempo',
  location: 'Jakarta, Indonesia',
  email: 'keianggoro12@gmail.com',
  github: 'https://github.com/keianggoro12',
  linkedin: 'https://www.linkedin.com/in/juliardi-dwi-anggoro-b40449257/',
  instagram: 'https://www.instagram.com/keianggoro12/',
  photo: '/kei.jpg',
  /**
   * PDF CV publik: salinan CV dengan alamat rumah dan nomor telepon disensor
   * (PRD §4.5). Tombol "Download CV" hanya muncul bila diisi.
   */
  resumeUrl: '/resume-kei-anggoro.pdf' as string | null,
  /** Awal karier QA, dasar hitungan "tahun di QA" (jangan dibulatkan ke atas). */
  qaSince: '2024-03',
  intro: {
    en: 'I lead QA at Tempo and build end-to-end test automation with Playwright and TypeScript.',
    id: 'Saya memimpin QA di Tempo dan membangun end-to-end test automation dengan Playwright dan TypeScript.',
  } satisfies Localized,
  headline: {
    en: 'I break software on purpose, so your users never have to.',
    id: 'Saya sengaja mencari celah di software, supaya pengguna Anda tidak pernah menemukannya.',
  } satisfies Localized,
  summary: {
    en: 'Results-driven Senior QA Engineer specializing in end-to-end test automation with Playwright and TypeScript. I define test plans, execute test cases, build automation frameworks, and work cross-functionally from backlog grooming to production release. I also build and ship my own web apps, so I understand the full SDLC from both sides of the bug report.',
    id: 'Senior QA Engineer yang fokus pada end-to-end test automation dengan Playwright dan TypeScript. Saya menyusun test plan, menjalankan test case, membangun framework automation, dan bekerja lintas tim dari backlog grooming sampai rilis production. Saya juga membangun dan merilis web app sendiri, jadi saya paham SDLC dari dua sisi laporan bug.',
  } satisfies Localized,
};

export const experiences: Experience[] = [
  {
    role: 'Senior Quality Assurance',
    company: 'PT Tempo Inti Media Tbk',
    location: 'Jakarta, Indonesia',
    start: '2024-11',
    end: null,
    highlights: [
      {
        en: 'Lead the QA team across the entire SDLC, from backlog grooming through to production release.',
        id: 'Memimpin tim QA di seluruh SDLC, dari backlog grooming sampai rilis production.',
      },
      {
        en: 'Develop and maintain automated UI and API test frameworks with Playwright and TypeScript.',
        id: 'Membangun dan merawat framework automation UI dan API dengan Playwright dan TypeScript.',
      },
      {
        en: 'Write and maintain UAT scripts that validate system functionality against requirements.',
        id: 'Menulis dan merawat skrip UAT untuk memvalidasi fungsi sistem terhadap requirement.',
      },
      {
        en: 'Investigate issues with product teams, document bugs and tasks, and support deployments.',
        id: 'Menginvestigasi isu bersama tim produk, mendokumentasikan bug dan task, serta mendukung deployment.',
      },
    ],
    tags: ['Team lead', 'Playwright', 'TypeScript', 'UAT', 'API testing'],
  },
  {
    role: 'QA Automation Engineer',
    company: 'Kinobi AI',
    type: { en: 'Freelance', id: 'Freelance' },
    location: 'Singapore · Remote',
    start: '2024-11',
    end: '2026-03',
    highlights: [
      {
        en: 'Developed and maintained automated UI and API tests with Playwright and TypeScript.',
        id: 'Membangun dan merawat automation test UI dan API dengan Playwright dan TypeScript.',
      },
      {
        en: 'Worked with QA engineers to implement maintainable, effective test scenarios.',
        id: 'Bekerja bersama QA engineer membuat skenario test yang mudah dirawat dan efektif.',
      },
      {
        en: 'Applied automation best practices to improve test stability, reliability, and speed.',
        id: 'Menerapkan best practice automation untuk meningkatkan stabilitas, keandalan, dan kecepatan test.',
      },
    ],
    tags: ['Playwright', 'TypeScript', 'API testing', 'Remote'],
  },
  {
    role: 'Quality Assurance Engineer',
    company: 'Kinobi AI',
    location: 'Singapore · Remote',
    start: '2024-03',
    end: '2024-11',
    highlights: [
      {
        en: 'Executed comprehensive test cases to verify each development task was implemented correctly.',
        id: 'Menjalankan test case menyeluruh untuk memastikan tiap task development terimplementasi dengan benar.',
      },
      {
        en: 'Built and maintained UAT scripts for continuous validation.',
        id: 'Membuat dan merawat skrip UAT untuk validasi berkelanjutan.',
      },
      {
        en: 'Investigated issues with engineering and product teams and logged tracked bugs.',
        id: 'Menginvestigasi isu bersama tim engineering dan produk, lalu mencatat bug yang dilacak.',
      },
      {
        en: 'Joined project kick-offs and assisted with application deployments.',
        id: 'Ikut kick-off project dan membantu deployment aplikasi.',
      },
    ],
    tags: ['Manual testing', 'UAT', 'Bug tracking'],
  },
  {
    role: 'Student Mentor',
    company: 'Terra AI',
    location: 'Singapore · Remote',
    start: '2022-08',
    end: '2022-11',
    highlights: [
      {
        en: 'Mentored 20 students in conversational design and chatbot development.',
        id: 'Membimbing 20 siswa dalam conversational design dan pengembangan chatbot.',
      },
      {
        en: 'Guided end-to-end chatbot creation, from user research to working prototype.',
        id: 'Mendampingi pembuatan chatbot end-to-end, dari riset pengguna sampai prototipe.',
      },
    ],
    tags: ['Mentoring', 'Conversational design'],
  },
  {
    role: 'Chatbot Developer Intern (Tokobot)',
    company: 'Terra AI',
    type: { en: 'Internship', id: 'Magang' },
    location: 'Singapore · Remote',
    start: '2022-02',
    end: '2022-07',
    highlights: [
      {
        en: 'Built scalable chatbot infrastructure and features for conversational design requirements.',
        id: 'Membangun infrastruktur dan fitur chatbot yang scalable sesuai kebutuhan conversational design.',
      },
      {
        en: 'Delivered reusable chatbot templates for micro and small businesses.',
        id: 'Menghasilkan template chatbot siap pakai untuk usaha mikro dan kecil.',
      },
    ],
    tags: ['Chatbot', 'Templates'],
  },
];

export const skills: Skill[] = [
  { name: 'API & UI Automation Testing', level: 'Expert', source: 'work' },
  { name: 'Postman', level: 'Expert', source: 'work' },
  { name: 'Playwright', level: 'Advanced', source: 'work' },
  { name: 'TypeScript', level: 'Advanced', source: 'work' },
  { name: 'Git & GitHub', level: 'Advanced', source: 'work' },
  { name: 'GitHub Actions', level: 'Intermediate', source: 'personal' },
  { name: 'Cloudflare Workers', level: 'Intermediate', source: 'personal' },
  { name: 'Cloudflare D1 & R2', level: 'Intermediate', source: 'personal' },
];

/** Cara kerja QA, ditampilkan sebagai kartu "What I bring". */
export const strengths: { icon: 'plan' | 'bot' | 'api' | 'rocket'; title: Localized; body: Localized }[] = [
  {
    icon: 'plan',
    title: { en: 'Test strategy that fits the risk', id: 'Strategi test sesuai risiko' },
    body: {
      en: 'Test plans and test cases built around what can actually hurt users and the business, not around a checklist.',
      id: 'Test plan dan test case disusun dari apa yang benar-benar bisa merugikan pengguna dan bisnis, bukan sekadar checklist.',
    },
  },
  {
    icon: 'bot',
    title: { en: 'Automation that stays green', id: 'Automation yang tetap hijau' },
    body: {
      en: 'Playwright + TypeScript frameworks with page objects, step screenshots, video, and reports a PM can read.',
      id: 'Framework Playwright + TypeScript dengan page object, screenshot per langkah, video, dan report yang bisa dibaca PM.',
    },
  },
  {
    icon: 'api',
    title: { en: 'API testing, not just clicking', id: 'API testing, bukan cuma klik' },
    body: {
      en: 'Contract and data checks with Postman and Playwright API tests, so bugs are caught before they reach the UI.',
      id: 'Pengecekan kontrak dan data dengan Postman dan Playwright API test, supaya bug tertangkap sebelum sampai ke UI.',
    },
  },
  {
    icon: 'rocket',
    title: { en: 'Release confidence', id: 'Rilis dengan percaya diri' },
    body: {
      en: 'From grooming to UAT to deployment day: clear bug reports, fast feedback, and no surprises in production.',
      id: 'Dari grooming, UAT, sampai hari deploy: laporan bug yang jelas, feedback cepat, dan tidak ada kejutan di production.',
    },
  },
];

export const education = {
  school: 'Muhammadiyah Buton University',
  degree: { en: 'Bachelor of Government Science', id: 'S1 Ilmu Pemerintahan' } satisfies Localized,
  gpa: '3.81 / 4.00',
  honor: { en: 'Cum Laude', id: 'Cum Laude' } satisfies Localized,
  location: 'Baubau, Indonesia',
  start: '2018-07',
  end: '2022-11',
};

export const certifications: Certification[] = [
  {
    name: 'Certificate in Quality Assurance Engineer',
    issuer: 'Alterra Academy',
    date: '2024-02',
    url: 'https://drive.google.com/file/d/1VV4gDWP1Jy0ZkF37HyvzWDFm2-FNDKNP/view',
    note: {
      en: 'Intensive immersive training: automation testing, API testing, and Agile.',
      id: 'Pelatihan intensif: automation testing, API testing, dan Agile.',
    },
  },
  {
    name: 'Advance Microsoft Excel',
    issuer: 'MySkill',
    url: 'https://drive.google.com/file/d/1yj-fw99x6OtqdPQmb_adjoYhayNksvoI/view',
  },
];
