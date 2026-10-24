import { test, expect } from '../../fixtures/test';
import { login } from '../../helpers/auth.helper';
import { expectResumeContent, fillResumeContent, openResumeForEdit } from '../../helpers/resume.helper';
import { ResumeEditorPage } from '../../pages/resume-editor.page';
import { generateResumeContent } from '../../utils/ai-generator';
import { generateResumeTitle } from '../../utils/data-generator';
import { buildResumeContent, dummyResumeText, pickProfession } from '../../utils/resume-content';
import { TIMEOUT } from '../../utils/timeout';

test.describe('Resume - Edit', () => {
  let resumeId = '';

  test.afterEach(async ({ api, account }) => {
    if (resumeId) await api.deleteResume(account.token, resumeId);
  });

  test('user can edit every section of a resume', async ({ page, account, api }) => {
    test.setTimeout(TIMEOUT.EXTRA_LONG);
    const title = generateResumeTitle();
    const contentPromise = generateResumeContent();
    // Data awal dibuat lewat API supaya test ini tidak bergantung pada test create.
    // Personal Information diisi data lama, lalu ditimpa lewat UI.
    const initial = buildResumeContent(dummyResumeText(pickProfession()), 'dummy');
    resumeId = await api.createResume(account.token, title);
    await api.seedPersonal(account.token, resumeId, initial.personal);
    console.log(`Editing resume: ${title}`);

    await login(page, account.email, account.password);
    await openResumeForEdit(page, title);
    const editorPage = new ResumeEditorPage(page);
    await expect(editorPage.personalInput('fullName'), 'CV yang dibuka berisi data lama').toHaveValue(initial.personal.fullName);

    const content = await contentPromise;
    console.log(`Resume content source: ${content.source}${content.model ? ` (${content.model})` : ''}`);
    await fillResumeContent(page, content);
    await expectResumeContent(page, resumeId, content);
    await expect(editorPage.previewText(initial.personal.fullName), 'Nama lama tidak lagi tampil di preview').toHaveCount(0);
  });
});
