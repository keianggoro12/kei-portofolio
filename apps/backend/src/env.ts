export interface Env {
  DB: D1Database;
  ARTIFACTS: R2Bucket;
  GITHUB_REPO: string;
  GITHUB_REF: string;
  MAX_RUNS_PER_IP_PER_DAY: string;
  MAX_PUBLIC_RUNS_PER_DAY: string;
  TURNSTILE_SITE_KEY: string;
  // Secrets; bisa kosong di lingkungan lokal.
  GITHUB_TOKEN?: string;
  TURNSTILE_SECRET_KEY?: string;
  RUNNER_TOKEN?: string;
  IP_HASH_SALT?: string;
}

export type AppEnv = { Bindings: Env };
