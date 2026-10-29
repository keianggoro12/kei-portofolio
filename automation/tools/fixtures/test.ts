import { test as networkTest } from './network';
import { ToolsApi } from '../helpers/api.helper';
import { addClickEffect } from '../utils/click-effect';
import { generateAccount, type Account } from '../utils/data-generator';

export * from '@playwright/test';

export interface BotAccount extends Account {
  token: string;
}

export const test = networkTest.extend<{ api: ToolsApi; clickEffect: void }, { account: BotAccount }>({
  api: async ({ request }, use) => {
    await use(new ToolsApi(request));
  },

  // Klik terlihat di video untuk semua test (headless tidak merekam kursor).
  clickEffect: [
    async ({ page }, use) => {
      await addClickEffect(page);
      await use();
    },
    { auto: true },
  ],

  // Akun bot baru per worker, didaftarkan lewat API. Tidak ada kredensial
  // permanen yang perlu disimpan, dan password tidak pernah sama antar run.
  account: [
    async ({ playwright }, use, workerInfo) => {
      const request = await playwright.request.newContext({ baseURL: workerInfo.project.use.baseURL });
      const account = generateAccount();
      const token = await new ToolsApi(request).register(account);
      await request.dispose();
      await use({ ...account, token });
    },
    { scope: 'worker' },
  ],
});
