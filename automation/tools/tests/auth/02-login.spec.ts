import { test, expect } from '../../fixtures/test';
import { login } from '../../helpers/auth.helper';
import { AuthPage } from '../../pages/auth.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { snap } from '../../utils/snap';

test.describe('Auth - Login', () => {
  test('registered user can log in', async ({ page, account }) => {
    console.log(`Logging in: ${account.email}`);

    await login(page, account.email, account.password);

    const authPage = new AuthPage(page);
    const dashboard = new DashboardPage(page);
    await test.step('Pastikan dashboard terbuka atas nama user', async () => {
      await snap(page, 'dashboard after login', { highlight: authPage.profileLink(account.name) });
    });
    await expect(page, 'Setelah login, user diarahkan ke dashboard').toHaveURL(/\/user\/dashboard$/);
    await expect(dashboard.greeting(account.name), 'Dashboard menyapa user yang login').toBeVisible();
    await expect(authPage.profileLink(account.name), 'Nama user tampil di sidebar').toBeVisible();
  });
});
