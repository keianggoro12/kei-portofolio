import { certifications, education, experiences, latestRun, profile, projects, skills, strengths, type SkillLevel } from '@kei/shared';
import { Award, Bot, Briefcase, ClipboardList, GraduationCap, Network, Rocket, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { cn, formatDuration, formatMonth, monthsBetween } from '@/lib/utils';
import { Reveal, SectionHeader } from './Reveal';

/** Angka naik dari 0 saat terlihat. */
function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const frame = (now: number) => {
        const progress = Math.min(1, (now - start) / 1200);
        setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {shown}
      {suffix}
    </span>
  );
}

export function Stats() {
  const { ui } = useLang();
  const qaYears = Math.floor(monthsBetween(profile.qaSince) / 12);
  const qaRoles = experiences.filter((e) => /quality|qa/i.test(e.role)).length;
  const stats = [
    { value: qaYears, suffix: ui.stats.yrs, label: ui.stats.qa },
    { value: qaRoles, suffix: '', label: ui.stats.roles },
    { value: projects.length, suffix: '', label: ui.stats.products },
    { value: latestRun.tests.length, suffix: '', label: ui.stats.e2e },
  ];

  return (
    <section className="container pt-24">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border bg-border lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 80} className="bg-card p-6 sm:p-8">
            <p className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              <CountUp value={stat.value} />
              <span className="text-primary">{stat.suffix}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const STRENGTH_ICONS = { plan: ClipboardList, bot: Bot, api: Network, rocket: Rocket };

export function About() {
  const { ui, t } = useLang();
  return (
    <section id="about" className="section container">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <SectionHeader eyebrow={ui.about.eyebrow} title={ui.about.title} />
          <Reveal delay={100}>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">{t(profile.summary)}</p>
          </Reveal>
        </div>
        <div>
          <Reveal>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">{ui.about.bring}</p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {strengths.map((item, i) => {
              const Icon = STRENGTH_ICONS[item.icon];
              return (
                <Reveal key={item.icon} delay={i * 90} className="card group p-6 transition hover:-translate-y-1 hover:border-primary/40">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold">{t(item.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(item.body)}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ExperienceSection() {
  const { ui, t, lang } = useLang();
  return (
    <section id="experience" className="section relative overflow-hidden bg-muted/40">
      <div className="container">
        <SectionHeader eyebrow={ui.experience.eyebrow} title={ui.experience.title} />
        <ol className="relative mt-14 space-y-6 border-l pl-6 sm:pl-10">
          {experiences.map((job, i) => {
            const current = job.end === null;
            const months = monthsBetween(job.start, job.end) + 1;
            return (
              <Reveal key={`${job.company}-${job.start}`} delay={i * 60}>
                <li className="relative">
                  <span
                    className={cn(
                      'absolute -left-[33px] top-7 grid h-4 w-4 place-items-center rounded-full border-2 bg-background sm:-left-[49px]',
                      current ? 'border-primary' : 'border-border'
                    )}
                  >
                    {current && <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-primary" />}
                  </span>
                  <article className={cn('card p-6 sm:p-8', current && 'border-primary/40')}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl font-semibold">{job.role}</h3>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span className="font-medium text-foreground">{job.company}</span>
                          {job.type && <span>· {t(job.type)}</span>}
                          <span>· {job.location}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn('chip', current && 'border-primary/40 text-primary')}>
                          {formatMonth(job.start, lang)} – {job.end ? formatMonth(job.end, lang) : ui.experience.present}
                        </p>
                        <p className="mt-1.5 font-mono text-xs text-muted-foreground">{formatDuration(months, lang)}</p>
                      </div>
                    </div>
                    <ul className="mt-5 space-y-2.5">
                      {job.highlights.map((h) => (
                        <li key={h.en} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
                          <span className="mt-0.5 font-mono text-primary">✓</span>
                          {t(h)}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                </li>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

const LEVEL_SCORE: Record<SkillLevel, number> = { Expert: 5, Advanced: 4, Intermediate: 3 };

export function SkillsSection() {
  const { ui } = useLang();
  const groups = [
    { key: 'work' as const, label: ui.skills.work },
    { key: 'personal' as const, label: ui.skills.personal },
  ];
  return (
    <section className="section container">
      <SectionHeader eyebrow={ui.skills.eyebrow} title={ui.skills.title} />
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {groups.map((group, gi) => (
          <Reveal key={group.key} delay={gi * 100} className="card p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
            <ul className="mt-6 space-y-5">
              {skills
                .filter((s) => s.source === group.key)
                .map((skill) => (
                  <li key={skill.name}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-medium">{skill.name}</span>
                      <span className={cn('font-mono text-xs', skill.level === 'Expert' ? 'text-primary' : 'text-muted-foreground')}>{skill.level}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-5 gap-1.5" aria-hidden>
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={cn('h-1.5 rounded-full', i < LEVEL_SCORE[skill.level] ? 'bg-primary' : 'bg-muted')} />
                      ))}
                    </div>
                  </li>
                ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function EducationSection() {
  const { ui, t, lang } = useLang();
  return (
    <section className="section container">
      <SectionHeader eyebrow={ui.education.eyebrow} title={ui.education.title} />
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <Reveal className="card relative overflow-hidden p-6 sm:p-8 lg:col-span-1">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h3 className="mt-5 font-display text-xl font-semibold">{education.school}</h3>
          <p className="mt-1 text-muted-foreground">{t(education.degree)}</p>
          <div className="mt-6 flex items-end gap-3">
            <p className="font-display text-4xl font-bold">{education.gpa.split(' ')[0]}</p>
            <p className="pb-1 text-sm text-muted-foreground">
              / 4.00 {ui.education.gpa} · <span className="font-semibold text-primary">{t(education.honor)}</span>
            </p>
          </div>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            {formatMonth(education.start, lang)} – {formatMonth(education.end, lang)} · {education.location}
          </p>
        </Reveal>
        {certifications.map((cert, i) => (
          <Reveal key={cert.name} delay={(i + 1) * 90} className="card group flex flex-col p-6 sm:p-8">
            <Award className="h-8 w-8 text-accent" />
            <h3 className="mt-5 font-display text-xl font-semibold">{cert.name}</h3>
            <p className="mt-1 text-muted-foreground">
              {cert.issuer}
              {cert.date && ` · ${formatMonth(cert.date, lang)}`}
            </p>
            {cert.note && <p className="mt-3 text-sm text-muted-foreground">{t(cert.note)}</p>}
            <a href={cert.url} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-primary">
              Credential <ExternalLink className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
