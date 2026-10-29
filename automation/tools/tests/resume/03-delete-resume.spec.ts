import { test, expect } from '../../fixtures/test';
import { login } from '../../helpers/auth.helper';
import { deleteResumeViaUi } from '../../helpers/resume.helper';
import { ResumeListPage } from '../../pages/resume-list.page';
import { generateResumeTitle } from '../../utils/data-generator';
import { snap } from '../../utils/snap';

test.describe('Resume - Delete', () => {
  let resumeId = '';

  // Cadangan bila test gagal sebelum CV terhapus lewat UI.
  test.afterEach(async ({ api, account }) => {
    if (resumeId) await api.deleteResume(account.token, resumeId);
  });

  test('user can delete a resume', async ({ page, account, api }) => {
    const title = generateResumeTitle();
    resumeId = await api.createResume(account.token, title);
    console.log(`Deleting resume: ${title}`);

    await login(page, account.email, account.password);
    await deleteResumeViaUi(page, title);

    const listPage = new ResumeListPage(page);
    await expect(listPage.resumeCard(title), 'CV hilang dari daftar setelah dihapus').toHaveCount(0);

    await test.step('Muat ulang daftar CV untuk memastikan CV benar-benar terhapus', async () => {
      await listPage.navigateToList();
      await snap(page, 'resume list after reload');
    });
    await expect(listPage.resumeCard(title), 'CV tetap tidak ada setelah reload').toHaveCount(0);
    expect(await api.listResumeTitles(account.token), 'CV tidak lagi dikembalikan API').not.toContain(title);
  });
});
