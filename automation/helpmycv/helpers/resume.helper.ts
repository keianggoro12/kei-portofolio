import { expect, test, type Page } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { ResumeEditorPage, type EntrySection } from '../pages/resume-editor.page';
import { ResumeListPage, type ResumeTemplate } from '../pages/resume-list.page';
import { resumeLocators } from '../locators/resume.locator';
import type { MonthYear, ResumeContent } from '../utils/resume-content';
import { snap } from '../utils/snap';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Urutan sama dengan urutan section di editor.
const SECTIONS: { key: EntrySection; label: string }[] = [
  { key: 'education', label: 'Education' },
  { key: 'experience', label: 'Experience' },
  { key: 'skills', label: 'Skills' },
  { key: 'projects', label: 'Projects' },
  { key: 'achievements', label: 'Achievements & Other' },
  { key: 'certifications', label: 'Certifications' },
];

type Entry = Record<string, unknown> & {
  start?: MonthYear;
  end?: MonthYear;
  date?: MonthYear;
  bullets?: string[];
};

function formatDate(date: MonthYear): string {
  return `${MONTHS[date.month - 1]} ${date.year}`;
}

/** Bentuk pembanding satu entri: field teks, tanggal "Mon YYYY", dan bullet. */
function expectedEntry(section: EntrySection, entry: Entry): Record<string, unknown> {
  const fields = Object.fromEntries(
    Object.keys(resumeLocators.editor.fields[section]).map((field) => [field, entry[field]])
  );
  return {
    ...fields,
    ...(entry.start && { start: formatDate(entry.start) }),
    ...(entry.end && { end: formatDate(entry.end) }),
    ...(entry.date && { date: formatDate(entry.date) }),
    ...(entry.bullets && { bullets: entry.bullets }),
  };
}

async function readDate(editorPage: ResumeEditorPage, section: EntrySection, field: 'startDate' | 'endDate' | 'date', index: number): Promise<string> {
  const month = await editorPage.monthSelect(section, field, index).locator('option:checked').innerText();
  const year = await editorPage.yearSelect(section, field, index).locator('option:checked').innerText();
  return `${month.trim()} ${year.trim()}`;
}

async function readEntry(editorPage: ResumeEditorPage, section: EntrySection, index: number, like: Entry): Promise<Record<string, unknown>> {
  const actual: Record<string, unknown> = {};
  for (const field of Object.keys(resumeLocators.editor.fields[section])) {
    actual[field] = await editorPage.entryInput(section, field as never, index).inputValue();
  }
  if (like.start) actual.start = await readDate(editorPage, section, 'startDate', index);
  if (like.end) actual.end = await readDate(editorPage, section, 'endDate', index);
  if (like.date) actual.date = await readDate(editorPage, section, 'date', index);
  if (like.bullets) {
    actual.bullets = await Promise.all(like.bullets.map((_, i) => editorPage.bulletInput(section, index, i).inputValue()));
  }
  return actual;
}

/**
 * Isi semua section CV di editor yang sedang terbuka. Dipakai bersama oleh
 * create dan edit: field yang sudah berisi ditimpa, entri ditambah bila kurang.
 */
export async function fillResumeContent(page: Page, content: ResumeContent): Promise<void> {
  const editorPage = new ResumeEditorPage(page);
  await test.step('Isi Personal Information', async () => {
    await editorPage.fillPersonal(content.personal);
    await snap(page, 'personal information filled', { highlight: editorPage.section('personal') });
  });

  for (const { key, label } of SECTIONS) {
    const entries = content[key] as Entry[];
    await test.step(`Isi section "${label}" (${entries.length} entri)`, async () => {
      await editorPage.ensureEntries(key, entries.length);
      for (const [i, entry] of entries.entries()) {
        await editorPage.fillEntryFields(key, i, entry as Record<string, string>);
        if (entry.start) await editorPage.selectDate(key, 'startDate', i, entry.start);
        if (entry.end) await editorPage.selectDate(key, 'endDate', i, entry.end);
        if (entry.date) await editorPage.selectDate(key, 'date', i, entry.date);
        if (entry.bullets) await editorPage.fillBullets(key, i, entry.bullets);
      }
      await snap(page, `${key} filled`, { highlight: editorPage.section(key) });
    });
  }

  await test.step('Klik tombol "Save"', async () => {
    await editorPage.save();
    await snap(page, 'resume saved', { highlight: editorPage.savedToast });
  });
}

/** Muat ulang editor lalu pastikan semua isi CV tersimpan sesuai `content`. */
export async function expectResumeContent(page: Page, resumeId: string, content: ResumeContent): Promise<void> {
  const editorPage = new ResumeEditorPage(page);
  await test.step('Muat ulang editor untuk memastikan isi CV tersimpan', async () => {
    await editorPage.navigateToEditor(resumeId);
    await expect(editorPage.personalInput('fullName')).toHaveValue(content.personal.fullName);
    await snap(page, 'resume after reload', { highlight: editorPage.previewText(content.personal.fullName) });
  });

  const personal = Object.fromEntries(
    await Promise.all(
      (Object.keys(content.personal) as (keyof ResumeContent['personal'])[]).map(
        async (field) => [field, await editorPage.personalInput(field).inputValue()] as const
      )
    )
  );
  expect(personal, 'Personal Information tersimpan sesuai data').toEqual(content.personal);

  for (const { key, label } of SECTIONS) {
    const entries = content[key] as Entry[];
    const actual = [];
    for (const [i, entry] of entries.entries()) actual.push(await readEntry(editorPage, key, i, entry));
    expect(actual, `Section "${label}" tersimpan sesuai data`).toEqual(entries.map((e) => expectedEntry(key, e)));
  }

  await expect(editorPage.previewText(content.personal.fullName), 'Nama tampil di preview CV').toBeVisible();
  // Gemini kadang menulis dua pengalaman di perusahaan yang sama (promosi), jadi teksnya bisa muncul dua kali.
  await expect(editorPage.previewText(content.experience[0].company as string).first(), 'Pengalaman kerja tampil di preview CV').toBeVisible();
}

/** Buat CV dari dashboard sampai editor terbuka; mengembalikan id CV. */
export async function createResumeViaUi(page: Page, title: string, template: ResumeTemplate = 'Classic'): Promise<string> {
  const dashboard = new DashboardPage(page);
  const listPage = new ResumeListPage(page);
  await test.step('Klik tombol "Create a CV" di dashboard', async () => {
    await dashboard.clickCreateCv();
    await snap(page, 'template dialog', { highlight: listPage.templateDialog });
  });
  await test.step(`Pilih template "${template}" lalu klik "Continue"`, () => listPage.chooseTemplate(template));
  await test.step('Isi nama CV', async () => {
    await listPage.fillResumeName(title);
    await snap(page, 'resume name filled');
  });
  return test.step('Klik "Continue" untuk membuat CV', async () => {
    const id = await listPage.submitResumeName();
    await snap(page, 'resume editor opened');
    return id;
  });
}

/** Buka CV yang sudah ada dari menu "Resumes" lalu masuk ke editor. */
export async function openResumeForEdit(page: Page, title: string): Promise<void> {
  const listPage = new ResumeListPage(page);
  await test.step('Buka menu "Resumes"', async () => {
    await listPage.navigateToList();
    await snap(page, 'resume list', { highlight: listPage.resumeCard(title) });
  });
  await test.step('Klik tombol "Edit" pada CV', () => listPage.openEdit(title));
}

export async function deleteResumeViaUi(page: Page, title: string): Promise<void> {
  const listPage = new ResumeListPage(page);
  await test.step('Buka menu "Resumes"', async () => {
    await listPage.navigateToList();
    await snap(page, 'resume list', { highlight: listPage.resumeCard(title) });
  });
  await test.step('Klik "More actions" pada CV lalu pilih "Delete"', async () => {
    await listPage.openDelete(title);
    await snap(page, 'delete confirmation', { highlight: listPage.deleteDialog });
  });
  await test.step('Klik tombol "Delete" pada pop-up konfirmasi', async () => {
    await listPage.confirmDelete();
    await snap(page, 'resume deleted');
  });
}
