import { expect, type Locator, type Page } from '@playwright/test';
import { authLocators } from '../locators/auth.locator';
import { resumeLocators } from '../locators/resume.locator';
import type { Account } from '../utils/data-generator';
import { fillSecret } from '../utils/secret';
import { TIMEOUT } from '../utils/timeout';

const { landing, dialog, sidebar } = authLocators;

export class AuthPage {
  constructor(private page: Page) {}

  get registerDialog(): Locator {
    return this.page.getByRole('dialog', { name: dialog.registerTitle });
  }

  get loginDialog(): Locator {
    return this.page.getByRole('dialog', { name: dialog.loginTitle });
  }

  get errorMessage(): Locator {
    return this.page.locator(dialog.errorMessage);
  }

  async navigateToLanding(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page.getByRole('button', { name: landing.signUpButton.name }).first()).toBeVisible();
  }

  async openRegisterDialog(): Promise<void> {
    await this.page.getByRole('button', { name: landing.signUpButton.name }).first().click();
    await expect(this.registerDialog).toBeVisible();
  }

  async openLoginDialog(): Promise<void> {
    await this.page.getByRole('button', { name: landing.logInButton.name }).first().click();
    await expect(this.loginDialog).toBeVisible();
  }

  async fillRegisterForm(account: Account): Promise<void> {
    const form = this.registerDialog;
    await form.getByRole('textbox', { name: dialog.nameInput.name }).fill(account.name);
    await form.getByRole('textbox', { name: dialog.phoneInput.name }).fill(account.phone);
    await form.getByRole('textbox', { name: dialog.emailInput.name }).fill(account.email);
    await fillSecret(form.getByRole('textbox', { name: dialog.passwordInput.name }), account.password);
    await fillSecret(form.getByRole('textbox', { name: dialog.confirmPasswordInput.name }), account.password);
  }

  async submitRegister(): Promise<void> {
    await this.registerDialog.getByRole('button', { name: dialog.registerSubmit.name }).click();
  }

  async fillLoginForm(email: string, password: string): Promise<void> {
    const form = this.loginDialog;
    await form.getByRole('textbox', { name: dialog.emailInput.name }).fill(email);
    await fillSecret(form.getByRole('textbox', { name: dialog.passwordInput.name }), password);
  }

  async submitLogin(): Promise<void> {
    await this.loginDialog.getByRole('button', { name: dialog.loginSubmit.name }).last().click();
  }

  async waitForDashboard(): Promise<void> {
    await this.page.waitForURL(`**${resumeLocators.dashboard.path}`, { timeout: TIMEOUT.MEDIUM });
    // Bukan networkidle: dashboard bisa terus punya request terbuka. Sidebar = sesi sudah terpasang.
    await expect(this.page.getByRole('button', { name: sidebar.signOutButton.name })).toBeVisible({ timeout: TIMEOUT.MEDIUM });
  }

  profileLink(name: string): Locator {
    return this.page.getByRole('link', { name: sidebar.profileLink.name }).filter({ hasText: name });
  }

  async signOut(): Promise<void> {
    await this.page.getByRole('button', { name: sidebar.signOutButton.name }).click();
    await this.page.waitForURL((url) => url.pathname === '/', { timeout: TIMEOUT.MEDIUM });
  }
}
