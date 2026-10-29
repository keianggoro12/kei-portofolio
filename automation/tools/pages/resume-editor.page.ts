import { expect, type Locator, type Page } from '@playwright/test';
import { resumeLocators } from '../locators/resume.locator';
import type { MonthYear, ResumeContent } from '../utils/resume-content';
import { TIMEOUT } from '../utils/timeout';

const { editor } = resumeLocators;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type EntrySection = keyof typeof editor.fields;
type PersonalField = keyof typeof editor.personal;
type DateField = 'startDate' | 'endDate' | 'date';

export class ResumeEditorPage {
  constructor(private page: Page) {}

  section(key: EntrySection | 'personal'): Locator {
    return this.page.locator(editor.section(key));
  }

  personalInput(field: PersonalField): Locator {
    return this.section('personal').getByRole('textbox', { name: editor.personal[field].name, exact: true });
  }

  /** Field teks entri ke-`index` di sebuah section, mis. ('experience', 'company', 1). */
  entryInput<S extends EntrySection>(section: S, field: keyof (typeof editor.fields)[S], index: number): Locator {
    const label = (editor.fields[section] as Record<string, string>)[field as string];
    return this.section(section).getByRole('textbox', { name: label, exact: true }).nth(index);
  }

  bulletInput(section: EntrySection, entry: number, bullet: number): Locator {
    return this.section(section).getByRole('textbox', { name: editor.bulletInput(bullet).name, exact: true }).nth(entry);
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: editor.saveButton.name, exact: true });
  }

  get savedToast(): Locator {
    return this.page.getByRole('alert').filter({ hasText: editor.savedToast });
  }

  title(title: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: title, exact: true });
  }

  /**
   * Teks di panel preview CV (kolom kanan). Preview punya salinan di luar layar
   * (`measure-tree`) untuk menghitung halaman, jadi salinan itu dikecualikan.
   */
  previewText(text: string): Locator {
    return this.page
      .getByRole('complementary')
      .filter({ hasText: 'Preview' })
      .getByText(text)
      .and(this.page.locator(`:not(${editor.previewMeasureTree} *)`));
  }

  async navigateToEditor(resumeId: string): Promise<void> {
    await this.page.goto(`/user/${resumeId}/edit`);
    await expect(this.personalInput('role')).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  async fillPersonal(personal: ResumeContent['personal']): Promise<void> {
    for (const field of Object.keys(editor.personal) as PersonalField[]) {
      await this.personalInput(field).fill(personal[field]);
    }
  }

  async entryCount(section: EntrySection): Promise<number> {
    const firstField = Object.keys(editor.fields[section])[0] as keyof (typeof editor.fields)[typeof section];
    return this.section(section).getByRole('textbox', { name: editor.fields[section][firstField], exact: true }).count();
  }

  /** Tambah entri sampai jumlahnya minimal `count`. Entri lama dibiarkan (ditimpa saat diisi). */
  async ensureEntries(section: EntrySection, count: number): Promise<void> {
    for (let current = await this.entryCount(section); current < count; current++) {
      await this.section(section).getByRole('button', { name: editor.addEntryButton.name, exact: true }).click();
      await expect.poll(() => this.entryCount(section)).toBe(current + 1);
    }
  }

  async fillEntryFields(section: EntrySection, index: number, values: Record<string, string>): Promise<void> {
    for (const field of Object.keys(editor.fields[section])) {
      await this.entryInput(section, field as never, index).fill(values[field]);
    }
  }

  async fillBullets(section: EntrySection, entry: number, bullets: string[]): Promise<void> {
    for (const [i, text] of bullets.entries()) {
      const input = this.bulletInput(section, entry, i);
      // Entri baru punya 3 baris bullet; tambah baris bila konten lebih banyak.
      if ((await input.count()) === 0) {
        await this.section(section).getByRole('button', { name: editor.addBulletButton.name, exact: true }).nth(entry).click();
      }
      await input.fill(text);
    }
  }

  monthSelect(section: EntrySection, field: DateField, entry: number): Locator {
    return this.section(section).locator(editor.monthSelect(field)).nth(entry);
  }

  yearSelect(section: EntrySection, field: DateField, entry: number): Locator {
    return this.section(section).locator(editor.yearSelect(field)).nth(entry);
  }

  async selectDate(section: EntrySection, field: DateField, entry: number, date: MonthYear): Promise<void> {
    await this.monthSelect(section, field, entry).selectOption({ label: MONTHS[date.month - 1] });
    await this.yearSelect(section, field, entry).selectOption({ label: String(date.year) });
  }

  async save(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
    await this.saveButton.click();
    await expect(this.savedToast).toBeVisible({ timeout: TIMEOUT.SHORT });
  }
}
