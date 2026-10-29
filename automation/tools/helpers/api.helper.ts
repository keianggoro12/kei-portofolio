import { expect, type APIRequestContext } from '@playwright/test';
import type { Account } from '../utils/data-generator';
import type { ResumeContent } from '../utils/resume-content';

/**
 * Akses langsung ke API Tools from Eiklab (same-origin `/api/*`, Bearer token).
 * Dipakai untuk menyiapkan data dan cleanup, supaya tiap test hanya
 * menguji satu alur lewat UI dan tidak bergantung pada test lain.
 */
export class ToolsApi {
  constructor(private request: APIRequestContext) {}

  private auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async register(account: Account): Promise<string> {
    const response = await this.request.post('/api/auth/register', {
      data: { name: account.name, email: account.email, password: account.password },
    });
    expect(response.status(), 'Register akun bot via API').toBe(201);
    return ((await response.json()) as { token: string }).token;
  }

  async login(email: string, password: string): Promise<string> {
    const response = await this.request.post('/api/auth/login', { data: { email, password } });
    expect(response.ok(), 'Login akun bot via API').toBe(true);
    return ((await response.json()) as { token: string }).token;
  }

  async createResume(token: string, title: string): Promise<string> {
    const response = await this.request.post('/api/resumes', { headers: this.auth(token), data: { title } });
    expect(response.status(), 'Buat CV via API').toBe(201);
    return ((await response.json()) as { resume: { id: string } }).resume.id;
  }

  /** Isi Personal Information CV lewat API (data awal untuk test edit). */
  async seedPersonal(token: string, id: string, personal: ResumeContent['personal']): Promise<void> {
    const current = await this.request.get(`/api/resumes/${id}`, { headers: this.auth(token) });
    expect(current.ok(), 'Ambil CV via API').toBe(true);
    const { resume } = (await current.json()) as { resume: { title: string; document: Record<string, unknown> } };
    const response = await this.request.patch(`/api/resumes/${id}`, {
      headers: this.auth(token),
      data: { title: resume.title, document: { ...resume.document, personal: { ...(resume.document.personal as object), ...personal } } },
    });
    expect(response.ok(), 'Isi data awal CV via API').toBe(true);
  }

  async listResumeTitles(token: string): Promise<string[]> {
    const response = await this.request.get('/api/resumes', { headers: this.auth(token) });
    expect(response.ok(), 'Ambil daftar CV via API').toBe(true);
    return ((await response.json()) as { resumes: { title: string }[] }).resumes.map((r) => r.title);
  }

  /** Cleanup: tidak gagal bila CV sudah terhapus lewat UI. */
  async deleteResume(token: string, id: string): Promise<void> {
    await this.request.delete(`/api/resumes/${id}`, { headers: this.auth(token) }).catch(() => undefined);
  }
}
