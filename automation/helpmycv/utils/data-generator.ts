import { faker } from '@faker-js/faker';

// Semua data buatan bot diberi prefix ini supaya mudah dikenali dan dibersihkan (PRD §6).
export const QA_PREFIX = '[QA-BOT]';

export interface Account {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export function generateAccount(): Account {
  return {
    name: `${QA_PREFIX} ${faker.person.fullName()}`,
    phone: `08${faker.string.numeric(10)}`,
    // example.com domain cadangan (RFC 2606): tidak ada email yang benar-benar terkirim.
    email: `qa-bot+${Date.now()}${faker.string.numeric(3)}@example.com`,
    password: `Qa!${faker.string.alphanumeric(12)}`,
  };
}

export function generateResumeTitle(): string {
  return `${QA_PREFIX} ${faker.person.jobTitle()} ${Date.now().toString(36)}`;
}
