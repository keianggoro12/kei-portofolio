import { latestRun, profile } from '@kei/shared';
import { ArrowRight, Download, MapPin, PlayCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/i18n';
import { formatDuration, monthsBetween } from '@/lib/utils';
import { Avatar } from './Avatar';
import { TestTerminal } from './TestTerminal';

const TECH = ['Playwright', 'TypeScript', 'Postman', 'API testing', 'UAT', 'GitHub Actions', 'Cloudflare'];

export function Hero() {
  const { ui, t, lang } = useLang();
  const qaMonths = monthsBetween(profile.qaSince);
  const passRate = Math.round((latestRun.tests.filter((test) => test.status === 'passed').length / latestRun.tests.length) * 100);

  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36">
      {/* Latar: grid + cahaya hijau/ungu */}
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] top-40 h-[360px] w-[360px] rounded-full bg-accent/20 blur-[120px]" />

      {/* `grid-cols-1` (minmax(0, 1fr)) di mobile: kolom implisit `auto` melebar
          mengikuti konten terlebar, sehingga di layar sempit seluruh kolom
          meluber ke kanan dan teks terpotong. */}
      <div className="container relative grid grid-cols-1 items-center gap-14 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-28">
        <div className="min-w-0">
          <Link
            to="/lab"
            className="group mb-4 inline-flex max-w-full animate-fade-up items-center gap-2 rounded-2xl border border-primary/25 sm:rounded-full bg-primary/5 py-1 pl-1 pr-3 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
          >
            <span className="shrink-0 whitespace-nowrap rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">{ui.nav.lab}</span>
            {/* Di mobile teksnya boleh turun baris alih-alih terpotong elipsis. */}
            <span className="min-w-0 sm:truncate">{ui.hero.labBanner}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" />
          </Link>
          <div className="flex min-w-0 animate-fade-up items-center gap-3">
            <Avatar className="h-11 w-11 lg:hidden" />
            <p className="chip">
            <span className="h-2 w-2 animate-pulse-ring rounded-full bg-primary" />
              {ui.hero.status} <span className="font-semibold text-foreground">{profile.currentCompany}</span>
            </p>
          </div>

          <h1 className="mt-6 animate-fade-up font-display text-5xl font-bold leading-[1.02] tracking-tight [animation-delay:80ms] sm:text-6xl lg:text-7xl">
            {ui.hero.hi}
            <span className="mt-3 block text-balance text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]">
              <span className="text-gradient">{t(profile.headline)}</span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl animate-fade-up text-lg text-muted-foreground text-pretty [animation-delay:160ms]">
            <span className="font-semibold text-foreground">{profile.name}</span>. {t(profile.intro)}
          </p>

          <div className="mt-8 flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
            <Link to="/lab" className="btn-primary">
              <PlayCircle className="h-4 w-4" />
              {ui.hero.cta.lab}
            </Link>
            <Link to="/#contact" className="btn-ghost">
              {ui.hero.cta.contact}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {profile.resumeUrl && (
              <a href={profile.resumeUrl} className="btn-ghost" download>
                <Download className="h-4 w-4" />
                {ui.hero.cta.cv}
              </a>
            )}
          </div>

          <div className="mt-8 flex animate-fade-up flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground [animation-delay:320ms]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              {ui.hero.based} {profile.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              {formatDuration(qaMonths, lang)} {ui.stats.qa}
            </span>
          </div>
        </div>

        {/* Foto + terminal test */}
        <div className="relative mx-auto w-full min-w-0 max-w-md animate-fade-up [animation-delay:200ms] lg:max-w-none">
          <div className="relative ml-auto aspect-[4/5] w-[86%] overflow-hidden rounded-[2rem] border bg-muted shadow-2xl shadow-primary/10 sm:w-[78%]">
            <img
              src={profile.photo}
              alt={profile.name}
              className="h-full w-full object-cover object-[32%_18%]"
              width={460}
              height={460}
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <div className="absolute right-4 top-4 rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-white backdrop-blur-md">
              <p className="font-display text-xl font-bold leading-none">{passRate}%</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-white/70">{ui.hero.passRate}</p>
            </div>
          </div>
          {/* Di mobile terminal ikut alur dan hanya menumpuk bagian bawah foto:
              versi absolute menutupi hampir seluruh foto begitu barisnya turun. */}
          <Link
            to="/lab"
            aria-label={ui.hero.cta.lab}
            className="group relative -mt-24 block w-full animate-float sm:absolute sm:-bottom-10 sm:left-0 sm:mt-0 sm:w-[94%] lg:-left-12"
          >
            <TestTerminal className="transition group-hover:border-primary/50" />
          </Link>
        </div>
      </div>

      {/* Marquee teknologi */}
      <div className="relative border-y bg-card/50 py-4 backdrop-blur">
        <div className="flex w-max animate-marquee gap-10 pr-10 font-mono text-sm text-muted-foreground [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          {[...TECH, ...TECH, ...TECH, ...TECH].map((tech, i) => (
            <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap">
              <span className="text-primary">✓</span>
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
