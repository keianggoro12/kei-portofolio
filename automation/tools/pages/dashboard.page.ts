import { expect, type Locator, type Page } from '@playwright/test';
import { resumeLocators } from '../locators/resume.locator';

const { dashboard } = resumeLocators;

export class DashboardPage {
  constructor(private page: Page) {}

  async navigateToDashboard(): Promise<void> {
    await this.page.goto(dashboard.path);
    await expect(this.page.getByRole('button', { name: dashboard.createButton.name })).toBeVisible();
  }

  // Sapaan memakai kata pertama nama, mis. "Hi, [QA-BOT]".
  greeting(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: `Hi, ${name.split(' ')[0]}` });
  }

  async clickCreateCv(): Promise<void> {
    await this.page.getByRole('button', { name: dashboard.createButton.name }).click();
  }
}
