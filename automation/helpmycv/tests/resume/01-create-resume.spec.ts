import { test, expect } from '../../fixtures/test';
import { login } from '../../helpers/auth.helper';
import { createResumeViaUi, expectResumeContent, fillResumeContent } from '../../helpers/resume.helper';
import { ResumeListPage } from '../../pages/resume-list.page';
import { generateResumeContent } from '../../utils/ai-generator';
import { generateResumeTitle } from '../../utils/data-generator';
import { snap } from '../../utils/snap';
import { TIMEOUT } from '../../utils/timeout';

test.describe('Resume - Create', () => {
  let resumeId = '';

  test.afterEach(async ({ api, account }) => {
    if (resumeId) await api.deleteResume(account.token, resumeId);
  });

  test('user can create a resume with every section filled', async ({ page, account }) => {
    test.setTimeout(TIMEOUT.EXTRA_LONG);
    const title = generateResumeTitle();
    // Gemini berjalan paralel dengan login supaya test tidak menunggu dua kali.
    const contentPromise = generateResumeContent();
    console.log(`Creating resume: ${title}`);

    await login(page, account.email, account.password);
    resumeId = await createResumeViaUi(page, title);

    const content = await contentPromise;
    console.log(`Resume content source: ${content.source}${content.model ? ` (${content.model})` : ''}`);
    await fillResumeContent(page, content);
    await expectResumeContent(page, resumeId, content);

    const listPage = new ResumeListPage(page);
    await test.step('Buka menu "Resumes" dan cari CV yang baru dibuat', async () => {
      await listPage.navigateToList();
      await snap(page, 'created resume in list', { highlight: listPage.resumeCard(title) });
    });
    await expect(listPage.resumeCard(title), 'CV yang baru dibuat muncul di daftar').toBeVisible();
  });
});
