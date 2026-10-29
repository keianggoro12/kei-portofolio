import { latestRun, profile, projects, type Localized, type Project, type TestCaseResult } from '@kei/shared';
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Clock, Copy, Download, Github, Instagram, Linkedin, Mail, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, artifactUrl, useLabConfig } from '@/lib/api';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { Logo } from './Navbar';
import { Reveal, SectionHeader } from './Reveal';

export function AutomationBadge({ project, className }: { project: Project; className?: string }) {
  const { ui } = useLang();
  return project.hasAutomation ? (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground', className)}>
      <Check className="h-3 w-3" strokeWidth={3} />
      {ui.projects.automated}
    </span>
  ) : (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur', className)}>
      <Clock className="h-3 w-3" />
      {ui.projects.notYet}
    </span>
  );
}

function ProjectCard({ project, featured }: { project: Project; featured: boolean }) {
  const { ui, t } = useLang();
  return (
    <article className={cn('card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:border-primary/40', featured && 'lg:flex-row')}>
      <Link to={`/projects/${project.slug}`} className={cn('relative block overflow-hidden bg-muted', featured ? 'aspect-[16/10] lg:aspect-auto lg:w-[58%]' : 'aspect-[16/10]')}>
        <img src={project.image} alt={`${project.name} screenshot`} loading="lazy" className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <AutomationBadge project={project} className="absolute left-4 top-4" />
      </Link>
      <div className={cn('flex flex-1 flex-col p-6 sm:p-8', featured && 'lg:justify-center')}>
        <h3 className="font-display text-2xl font-semibold">{project.name}</h3>
        <p className="mt-2 text-muted-foreground">{t(project.tagline)}</p>
        {featured && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t(project.description)}</p>}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {project.stack.slice(0, featured ? 7 : 4).map((tech) => (
            <span key={tech} className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
              {tech}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6 text-sm font-semibold">
          <Link to={`/projects/${project.slug}`} className="inline-flex items-center gap-1.5 text-primary">
            {project.hasAutomation ? ui.projects.caseStudy : ui.projects.details}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <a href={project.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            {ui.projects.visit}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}

export function ProjectsSection() {
  const { ui } = useLang();
  // Project yang sudah punya automation tampil paling depan dan lebar.
  const ordered = [...projects].sort((a, b) => Number(b.hasAutomation) - Number(a.hasAutomation));
  return (
    <section id="projects" className="section container">
      <SectionHeader eyebrow={ui.projects.eyebrow} title={ui.projects.title} subtitle={ui.projects.subtitle} />
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {ordered.map((project, i) => (
          <Reveal key={project.slug} delay={i * 90} className={cn(i === 0 && 'lg:col-span-2')}>
            <ProjectCard project={project} featured={i === 0} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

interface ShownRun {
  date: string;
  source: 'local' | 'github-actions';
  tests: TestCaseResult[];
  steps: { image: string; label: Localized }[];
}

/** Run terakhir yang lulus di QA Lab; latestRun statis hanya cadangan bila API gagal. */
async function loadLatestRun(): Promise<ShownRun> {
  const summary = (await api.runs(latestRun.project)).find((run) => run.status === 'passed');
  if (!summary) return latestRun;
  const run = await api.run(summary.id);
  // Satu baris per test case; attempt retry belakangan menimpa yang sebelumnya.
  const byCase = new Map(run.tests.map((test) => [test.tcId ?? test.id, test]));
  return {
    date: (run.finishedAt ?? run.createdAt).slice(0, 10),
    source: 'github-actions',
    tests: [...byCase].map(([id, test]) => ({
      id,
      title: test.title.charAt(0).toUpperCase() + test.title.slice(1),
      status: test.status === 'running' ? 'passed' : test.status,
      durationMs: test.durationMs ?? 0,
    })),
    steps: latestRun.steps.map((step) => {
      const key = byCase.get(step.tcId)?.steps.find((s) => s.screenshotKey && s.label.startsWith(step.match))?.screenshotKey;
      return key ? { ...step, image: artifactUrl(key) } : step;
    }),
  };
}

let latestRunPromise: Promise<ShownRun> | null = null;
function useLatestRun(): ShownRun {
  const [run, setRun] = useState<ShownRun>(latestRun);
  useEffect(() => {
    latestRunPromise ??= loadLatestRun().catch(() => latestRun);
    let alive = true;
    void latestRunPromise.then((r) => alive && setRun(r));
    return () => {
      alive = false;
    };
  }, []);
  return run;
}

/** Ringkasan run terakhir ala report Playwright. */
export function RunReport({ className }: { className?: string }) {
  const { ui } = useLang();
  const latestRun = useLatestRun();
  const passed = latestRun.tests.filter((test) => test.status === 'passed').length;
  const total = latestRun.tests.reduce((sum, test) => sum + test.durationMs, 0);
  return (
    <div className={cn('overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] font-mono text-sm', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">
            {ui.lab.latest} · {latestRun.date} · {latestRun.source === 'local' ? ui.lab.local : 'GitHub Actions'}
          </p>
          <p className="mt-1 text-white">tools / chromium</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
            {passed}/{latestRun.tests.length} {ui.lab.passed}
          </span>
          <span className="text-xs text-white/50">
            {ui.lab.duration} {formatSeconds(total)}
          </span>
        </div>
      </div>
      <ul className="divide-y divide-white/5">
        {latestRun.tests.map((test) => (
          <li key={test.id} className="flex items-center gap-3 px-5 py-3">
            <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full', test.status === 'passed' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300')}>
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="hidden w-24 shrink-0 text-xs text-white/40 sm:block">{test.id}</span>
            <span className="min-w-0 flex-1 font-sans text-white/85 sm:truncate">
              <span className="block font-mono text-[11px] text-white/40 sm:hidden">{test.id}</span>
              {test.title}
            </span>
            <span className="text-xs text-white/40">{formatSeconds(test.durationMs)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Galeri screenshot per langkah (pengganti sementara StepsView live). */
export function StepGallery({ className }: { className?: string }) {
  const { ui, t } = useLang();
  const [index, setIndex] = useState(0);
  const { steps } = useLatestRun();
  const step = steps[index];
  const go = (delta: number) => setIndex((i) => (i + delta + steps.length) % steps.length);

  return (
    <div className={cn('overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]', className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 font-mono text-xs text-white/50">
        <span className="uppercase tracking-widest">{ui.lab.steps}</span>
        <span>
          {String(index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
        </span>
      </div>
      <div className="relative aspect-video bg-black">
        <img key={step.image} src={step.image} alt={t(step.label)} className="h-full w-full animate-fade-up object-cover object-top [animation-duration:.4s]" loading="lazy" />
        <button type="button" onClick={() => go(-1)} aria-label="Previous step" className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Next step" className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <p className="px-5 pt-4 text-sm text-white/80">{t(step.label)}</p>
      <div className="flex gap-2 overflow-x-auto px-5 pb-5 pt-3">
        {steps.map((s, i) => (
          <button
            key={s.image}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={t(s.label)}
            className={cn('aspect-video w-20 shrink-0 overflow-hidden rounded-lg border-2 transition', i === index ? 'border-emerald-400' : 'border-transparent opacity-50 hover:opacity-100')}
          >
            <img src={s.image} alt="" className="h-full w-full object-cover object-top" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function LabSection() {
  const { ui } = useLang();
  const runEnabled = useLabConfig()?.runEnabled ?? false;
  return (
    <section id="lab" className="relative overflow-hidden bg-ink py-20 text-white sm:py-28">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(hsl(156_72%_52%/0.18)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="container relative">
        <Reveal className="max-w-2xl">
          <p className="eyebrow !text-emerald-400">
            <span className="h-px w-6 bg-emerald-400" />
            {ui.lab.eyebrow}
          </p>
          <h2 className="heading mt-4 text-balance">{ui.lab.title}</h2>
          <p className="mt-4 text-lg text-white/65 text-pretty">{ui.lab.subtitle}</p>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <Reveal className="min-w-0">
            <RunReport />
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link to="/lab" className="btn bg-emerald-400 text-ink hover:-translate-y-0.5 hover:bg-emerald-300">
                <PlayCircle className="h-4 w-4" />
                {ui.lab.open}
              </Link>
              <span className="inline-flex items-center gap-2 font-mono text-xs text-white/50">
                <span className={cn('h-2 w-2 animate-pulse rounded-full', runEnabled ? 'bg-emerald-400' : 'bg-amber-400')} />
                {runEnabled ? ui.lab.live : ui.lab.soon}
              </span>
            </div>
          </Reveal>
          <Reveal delay={120} className="min-w-0">
            <StepGallery />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  const { ui } = useLang();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <section id="contact" className="section container">
      <Reveal className="relative overflow-hidden rounded-[2.5rem] border bg-card px-6 py-16 text-center sm:px-12 sm:py-20">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-32 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-primary/25 blur-[100px]" />
        <div className="relative">
          <Avatar className="mx-auto h-20 w-20 border-4 border-background shadow-lg" />
          <p className="eyebrow mt-6 justify-center">{ui.contact.eyebrow}</p>
          <h2 className="heading mx-auto mt-4 max-w-2xl text-balance">{ui.contact.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{ui.contact.subtitle}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={`mailto:${profile.email}`} className="btn-primary">
              <Mail className="h-4 w-4" />
              {ui.contact.email}
            </a>
            {profile.resumeUrl && (
              <a href={profile.resumeUrl} download className="btn-ghost">
                <Download className="h-4 w-4" />
                {ui.hero.cta.cv}
              </a>
            )}
          </div>
          <button type="button" onClick={copy} className="mt-3 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition hover:text-foreground sm:text-sm">
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? ui.contact.copied : profile.email}
          </button>
          <div className="mt-6 flex justify-center gap-3">
            <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="grid h-11 w-11 place-items-center rounded-full border bg-background transition hover:-translate-y-0.5 hover:border-primary hover:text-primary">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="grid h-11 w-11 place-items-center rounded-full border bg-background transition hover:-translate-y-0.5 hover:border-primary hover:text-primary">
              <Github className="h-5 w-5" />
            </a>
            <a href={profile.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-11 w-11 place-items-center rounded-full border bg-background transition hover:-translate-y-0.5 hover:border-primary hover:text-primary">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  const { ui } = useLang();
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <Logo />
        <p className="text-center">{ui.footer.built}</p>
        <p className="font-mono text-xs">© {new Date().getFullYear()} {profile.name}</p>
      </div>
    </footer>
  );
}
