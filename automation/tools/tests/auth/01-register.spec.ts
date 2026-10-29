import { test, expect } from '../../fixtures/test';
import { registerViaUi } from '../../helpers/auth.helper';
import { AuthPage } from '../../pages/auth.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { generateAccount } from '../../utils/data-generator';
import { snap } from '../../utils/snap';

test.describe('Auth - Register', () => {
  test('visitor can register a new account', async ({ page }) => {
    const account = generateAccount();
    console.log(`Registering: ${account.email}`);

    await registerViaUi(page, account);

    const authPage = new AuthPage(page);
    const dashboard = new DashboardPage(page);
    await test.step('Pastikan dashboard terbuka atas nama user baru', async () => {
      await snap(page, 'dashboard after register', { highlight: authPage.profileLink(account.name) });
    });
    await expect(page, 'Setelah daftar, user diarahkan ke dashboard').toHaveURL(/\/user\/dashboard$/);
    await expect(dashboard.greeting(account.name), 'Dashboard menyapa user baru').toBeVisible();
    await expect(authPage.profileLink(account.name), 'Nama user baru tampil di sidebar').toBeVisible();
  });
});
