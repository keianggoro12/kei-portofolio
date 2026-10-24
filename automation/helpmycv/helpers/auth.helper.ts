import { expect, test, type Page } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import type { Account } from '../utils/data-generator';
import { snap } from '../utils/snap';

export async function registerViaUi(page: Page, account: Account): Promise<void> {
  const authPage = new AuthPage(page);
  await test.step('Buka halaman utama HelpMyCV', async () => {
    await authPage.navigateToLanding();
    await snap(page, 'landing page');
  });
  await test.step('Klik tombol "Sign up"', async () => {
    await authPage.openRegisterDialog();
    await snap(page, 'register dialog', { highlight: authPage.registerDialog });
  });
  await test.step('Isi nama, nomor HP, email, password, dan konfirmasi password', async () => {
    await authPage.fillRegisterForm(account);
    await snap(page, 'register form filled');
  });
  await test.step('Klik tombol "Create account"', async () => {
    await authPage.submitRegister();
    await authPage.waitForDashboard();
  });
}

export async function login(page: Page, email: string, password: string): Promise<void> {
  const authPage = new AuthPage(page);
  await test.step('Buka halaman utama HelpMyCV', () => authPage.navigateToLanding());
  await test.step('Klik tombol "Log in"', async () => {
    await authPage.openLoginDialog();
    await snap(page, 'login dialog', { highlight: authPage.loginDialog });
  });
  await test.step('Isi email dan password', async () => {
    await authPage.fillLoginForm(email, password);
    await snap(page, 'login form filled');
  });
  await test.step('Klik tombol "Log in" pada form', async () => {
    await authPage.submitLogin();
    await authPage.waitForDashboard();
    await expect(authPage.errorMessage, 'Tidak ada pesan error login').toBeHidden();
  });
}
