import { expect, type Locator, type Page } from '@playwright/test';
import { resumeLocators } from '../locators/resume.locator';
import { TIMEOUT } from '../utils/timeout';

const { list, templateDialog, nameDialog, deleteDialog, editor } = resumeLocators;

export type ResumeTemplate = 'Blank' | 'Classic';

export class ResumeListPage {
  constructor(private page: Page) {}

  get templateDialog(): Locator {
    return this.page.getByRole('dialog', { name: templateDialog.title });
  }

  get nameDialog(): Locator {
    return this.page.getByRole('dialog', { name: nameDialog.title });
  }

  get deleteDialog(): Locator {
    return this.page.getByRole('dialog', { name: deleteDialog.title });
  }

  async navigateToList(): Promise<void> {
    await this.page.goto(list.path);
    await expect(this.page.getByRole('heading', { name: list.heading.name })).toBeVisible();
  }

  /** Kartu CV di daftar, dicari lewat judul persis. */
  resumeCard(title: string): Locator {
    return this.page
      .getByRole('listitem')
      .filter({ has: this.page.getByRole('heading', { level: 3, name: title, exact: true }) });
  }

  async chooseTemplate(template: ResumeTemplate): Promise<void> {
    await expect(this.templateDialog).toBeVisible();
    await this.templateDialog.getByRole('button', { name: template, exact: true }).click();
    await this.templateDialog.getByRole('button', { name: templateDialog.continueButton.name }).click();
  }

  async fillResumeName(title: string): Promise<void> {
    await expect(this.nameDialog).toBeVisible();
    await this.nameDialog.getByRole('textbox', { name: nameDialog.nameInput.name }).fill(title);
  }

  /** Submit nama CV lalu tunggu editor terbuka; mengembalikan id CV dari URL. */
  async submitResumeName(): Promise<string> {
    await this.nameDialog.getByRole('button', { name: nameDialog.continueButton.name }).click();
    await this.page.waitForURL(editor.pathPattern, { timeout: TIMEOUT.MEDIUM });
    return this.page.url().match(editor.pathPattern)?.[1] ?? '';
  }

  async openEdit(title: string): Promise<void> {
    await this.resumeCard(title).getByRole('button', { name: list.editButton.name, exact: true }).click();
    await this.page.waitForURL(editor.pathPattern, { timeout: TIMEOUT.MEDIUM });
    await expect(this.page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
  }

  async openDelete(title: string): Promise<void> {
    await this.resumeCard(title).getByRole('button', { name: list.moreActionsButton.name }).click();
    await this.page.getByRole('menuitem', { name: list.deleteMenuItem.name }).click();
    await expect(this.deleteDialog).toBeVisible();
  }

  async confirmDelete(): Promise<void> {
    await this.deleteDialog.getByRole('button', { name: deleteDialog.confirmButton.name, exact: true }).click();
    await expect(this.deleteDialog).toBeHidden({ timeout: TIMEOUT.SHORT });
  }
}
