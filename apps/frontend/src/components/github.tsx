import { githubLevel, profile, summarizeGithub, type GithubDay, type GithubStats } from '@kei/shared';
import { ArrowUpRight, CalendarDays, Flame, GitCommitHorizontal, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { api } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { cn, type Lang } from '@/lib/utils';
import { Reveal, SectionHeader } from './Reveal';
import { CountUp } from './sections';

const RANGES = [12, 6, 3] as const;
type Range = (typeof RANGES)[number];
const WEEKS: Record<Range, number> = { 12: 52, 6: 26, 3: 13 };
const LEVEL_CLASS = ['bg-muted', 'bg-primary/25', 'bg-primary/50', 'bg-primary/75', 'bg-primary'];
const TOP_LANGUAGES = 6;

/** Gagal ambil = section disembunyikan; situs tetap utuh tanpa GitHub. */
function useGithubStats(): { stats: GithubStats | null; failed: boolean } {
  const [state, setState] = useState<{ stats: GithubStats | null; failed: boolean }>({ stats: null, failed: false });
  useEffect(() => {
    let alive = true;
    api
      .github()
      .then((stats) => alive && setState({ stats, failed: false }))
      .catch(() => alive && setState({ stats: null, failed: true }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

function locale(lang: Lang): string {
  return lang === 'id' ? 'id-ID' : 'en-US';
}

function formatDay(date: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
}

function timeAgo(iso: string, lang: Lang): string {
  const minutes = Math.round((Date.parse(iso) - Date.now()) / 60_000);
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' });
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  if (Math.abs(minutes) < 60 * 24) return rtf.format(Math.round(minutes / 60), 'hour');
  return rtf.format(Math.round(minutes / 1440), 'day');
}

export function GithubSection() {
  const { ui, lang } = useLang();
  const { stats, failed } = useGithubStats();
  const [range, setRange] = useState<Range>(12);

  const days = useMemo(() => {
    if (!stats) return [];
    const weeks = Math.ceil(stats.days.length / 7);
    return stats.days.slice(Math.max(0, weeks - WEEKS[range]) * 7);
  }, [stats, range]);
  const summary = useMemo(() => summarizeGithub(days), [days]);

  if (failed) return null;

  const tiles = [
    { icon: GitCommitHorizontal, value: summary.total, label: ui.github.commits },
    { icon: CalendarDays, value: summary.activeDays, label: ui.github.activeDays },
    { icon: Flame, value: summary.currentStreak, label: `${ui.github.currentStreak} (${ui.github.days(summary.currentStreak)})` },
    { icon: Trophy, value: summary.longestStreak, label: `${ui.github.longestStreak} (${ui.github.days(summary.longestStreak)})` },
  ];

  return (
    <section id="github" className="section container">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeader eyebrow={ui.github.eyebrow} title={ui.github.title} subtitle={ui.github.subtitle} />
        <Reveal>
          <a href={profile.github} target="_blank" rel="noreferrer" className="btn-ghost">
            {ui.github.profile}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </Reveal>
      </div>

      {!stats ? (
        <div className="mt-12 h-[420px] animate-pulse rounded-3xl border bg-muted/40" aria-busy />
      ) : (
        <>
          <Reveal className="card mt-12 p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">{ui.github.activity}</p>
              <div role="radiogroup" aria-label={ui.github.range} className="inline-flex rounded-full border bg-muted/50 p-1">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={range === r}
                    onClick={() => setRange(r)}
                    className={cn(
                      'rounded-full px-3 py-1 font-mono text-xs transition',
                      range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {ui.github.months(r)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-4">
              {tiles.map(({ icon: Icon, value, label }) => (
                <div key={label} className="bg-card p-4 sm:p-5">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="mt-3 font-display text-3xl font-bold tracking-tight">
                    <CountUp value={value} />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <Heatmap key={range} days={days} />

            <p className="mt-4 text-xs text-muted-foreground">
              {ui.github.updated} {timeAgo(stats.generatedAt, lang)}
            </p>
          </Reveal>

          <Reveal delay={100} className="card mt-6 p-5 sm:p-8">
            <Languages stats={stats} />
          </Reveal>
        </>
      )}
    </section>
  );
}

function Heatmap({ days }: { days: GithubDay[] }) {
  const { ui, lang } = useLang();
  const level = useMemo(() => githubLevel(days), [days]);
  const cols = Math.ceil(days.length / 7);
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<{ index: number; left: number; top: number } | null>(null);

  // Di layar sempit grafik digulir; mulai dari minggu terbaru.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const months = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    const fmt = new Intl.DateTimeFormat(locale(lang), { month: 'short', timeZone: 'UTC' });
    for (let col = 0; col < cols; col++) {
      const day = days[col * 7];
      if (!day) continue;
      const date = new Date(day.date);
      const prev = labels[labels.length - 1];
      if (date.getUTCDate() <= 7 && (!prev || col - prev.col >= 3)) labels.push({ col, label: fmt.format(date) });
    }
    return labels;
  }, [days, cols, lang]);

  function show(index: number) {
    const cell = scrollRef.current?.querySelector<HTMLElement>(`[data-i="${index}"]`);
    const wrap = wrapRef.current;
    if (!cell || !wrap) return;
    cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const c = cell.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    setActive({ index, left: c.left - w.left + c.width / 2, top: c.top - w.top });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const from = active?.index ?? days.length - 1;
    show(Math.min(days.length - 1, Math.max(0, from + step)));
  }

  const activeDay = active ? days[active.index] : null;
  const label = activeDay ? ui.github.day(activeDay.count, formatDay(activeDay.date, lang)) : '';

  return (
    <div ref={wrapRef} className="relative mt-8">
      <div ref={scrollRef} className="-mx-1 overflow-x-auto px-1 pb-2 pt-1">
        <div style={{ minWidth: cols * 14, maxWidth: cols * 26 }}>
          <div className="relative mb-2 h-4 font-mono text-[10px] text-muted-foreground" aria-hidden>
            {months.map((m) => (
              <span key={m.col} className="absolute whitespace-nowrap" style={{ left: `${(m.col / cols) * 100}%` }}>
                {m.label}
              </span>
            ))}
          </div>
          <div
            role="img"
            aria-label={`${ui.github.activity}. ${ui.github.keyboard}`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onFocus={() => active === null && show(days.length - 1)}
            onBlur={() => setActive(null)}
            onMouseLeave={() => setActive(null)}
            className="grid grid-flow-col gap-[3px] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-card"
            style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))', gridTemplateColumns: `repeat(${cols}, minmax(11px, 1fr))` }}
          >
            {days.map((day, i) => (
              <span
                key={day.date}
                data-i={i}
                onMouseEnter={() => show(i)}
                className={cn(
                  'aspect-square rounded-[3px] transition',
                  LEVEL_CLASS[level(day.count)],
                  active?.index === i && 'ring-2 ring-foreground ring-offset-1 ring-offset-card'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {active && activeDay && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg"
          style={{ left: active.left, top: active.top - 8 }}
        >
          {label}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {label}
      </p>

      <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[10px] text-muted-foreground" aria-hidden>
        {ui.github.less}
        {LEVEL_CLASS.map((cls) => (
          <span key={cls} className={cn('h-2.5 w-2.5 rounded-[3px]', cls)} />
        ))}
        {ui.github.more}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

function Languages({ stats }: { stats: GithubStats }) {
  const { ui } = useLang();
  const [hovered, setHovered] = useState<string | null>(null);

  const rows = useMemo(() => {
    const total = stats.languages.reduce((sum, l) => sum + l.bytes, 0) || 1;
    const top = stats.languages.slice(0, TOP_LANGUAGES).map((l) => ({ name: l.name, color: l.color ?? 'hsl(var(--muted-foreground))', bytes: l.bytes }));
    const rest = stats.languages.slice(TOP_LANGUAGES).reduce((sum, l) => sum + l.bytes, 0);
    if (rest > 0) top.push({ name: 'Other', color: 'hsl(var(--border))', bytes: rest });
    return top.map((row) => ({ ...row, pct: (row.bytes / total) * 100 }));
  }, [stats]);

  return (
    <div onMouseLeave={() => setHovered(null)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">{ui.github.languages}</p>
        <p className="text-xs text-muted-foreground">{ui.github.languagesNote(stats.repos.total)}</p>
      </div>

      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
        {rows.map((row) => (
          <span
            key={row.name}
            onMouseEnter={() => setHovered(row.name)}
            className="h-full transition-opacity duration-300"
            style={{ width: `${row.pct}%`, backgroundColor: row.color, opacity: hovered && hovered !== row.name ? 0.25 : 1 }}
          />
        ))}
      </div>

      <ul className="mt-6 grid gap-x-8 gap-y-1 sm:grid-cols-2">
        {rows.map((row) => (
          <li key={row.name}>
            <button
              type="button"
              onMouseEnter={() => setHovered(row.name)}
              onFocus={() => setHovered(row.name)}
              onBlur={() => setHovered(null)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                hovered === row.name ? 'bg-muted' : hovered ? 'opacity-50' : ''
              )}
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
              <span className="flex-1 font-medium">{row.name}</span>
              <span className={cn('font-mono text-xs text-muted-foreground transition', hovered === row.name ? 'opacity-100' : 'opacity-0')}>{formatBytes(row.bytes)}</span>
              <span className="w-14 text-right font-mono text-sm">{row.pct < 0.1 ? '<0.1' : row.pct.toFixed(1)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
