// Snapshot aktivitas GitHub yang disusun backend dan dibaca frontend.
// Nama repo private sengaja tidak ikut: yang keluar hanya angka agregat.

export interface GithubDay {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
}

export interface GithubLanguage {
  name: string;
  color: string | null;
  bytes: number;
}

export interface GithubStats {
  login: string;
  generatedAt: string;
  /** 52 minggu terakhir, Minggu sampai Sabtu, urut naik. Commit dari semua repo milik sendiri, termasuk private. */
  days: GithubDay[];
  /** Agregat byte per bahasa dari repo milik sendiri (bukan fork), urut turun. */
  languages: GithubLanguage[];
  repos: { total: number; public: number; private: number };
  followers: number;
  /** Ada repo yang statistiknya belum dihitung GitHub (HTTP 202); angka bisa sedikit kurang. */
  partial: boolean;
}

export interface GithubSummary {
  total: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  busiest: GithubDay | null;
}

/** Streak berjalan tetap dihitung bila hari ini belum ada commit (mengikuti GitHub). */
export function summarizeGithub(days: GithubDay[]): GithubSummary {
  let total = 0;
  let activeDays = 0;
  let longestStreak = 0;
  let run = 0;
  let busiest: GithubDay | null = null;
  for (const day of days) {
    total += day.count;
    if (day.count > 0) {
      activeDays++;
      run++;
      longestStreak = Math.max(longestStreak, run);
      if (!busiest || day.count > busiest.count) busiest = day;
    } else {
      run = 0;
    }
  }
  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) currentStreak++;
    else if (i < days.length - 1 || currentStreak > 0) break;
  }
  return { total, activeDays, currentStreak, longestStreak, busiest };
}

/** Level warna 0–4 seperti grafik kontribusi GitHub: kuartil dari hari yang ada commit. */
export function githubLevel(days: GithubDay[]): (count: number) => 0 | 1 | 2 | 3 | 4 {
  const sorted = days.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  return (count) => (count <= 0 ? 0 : count <= q1 ? 1 : count <= q2 ? 2 : count <= q3 ? 3 : 4);
}
