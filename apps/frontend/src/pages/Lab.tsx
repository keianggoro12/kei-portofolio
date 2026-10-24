import { projects } from '@kei/shared';
import { Activity, Cloud, MousePointerClick, Server } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/Reveal';
import { RunReport, StepGallery } from '@/components/showcase';
import { useLang } from '@/lib/i18n';

const FLOW_ICONS = [MousePointerClick, Server, Cloud, Activity];

export default function Lab() {
  const { ui } = useLang();
  const automated = projects.filter((p) => p.hasAutomation);

  return (
    <div className="min-h-screen bg-ink pb-24 pt-28 text-white">
      <div className="container">
        <Reveal className="max-w-3xl">
          <p className="eyebrow !text-emerald-400">
            <span className="h-px w-6 bg-emerald-400" />
            {ui.lab.eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">{ui.lab.title}</h1>
          <p className="mt-4 text-lg text-white/65">{ui.lab.subtitle}</p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-mono text-xs text-amber-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            {ui.lab.soon}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <Reveal>
            <RunReport />
            <div className="mt-6 flex flex-wrap gap-2">
              {automated.map((p) => (
                <Link key={p.slug} to={`/projects/${p.slug}`} className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:border-emerald-400 hover:text-white">
                  {p.name} →
                </Link>
              ))}
            </div>
          </Reveal>
          <Reveal delay={100}>
            <StepGallery />
          </Reveal>
        </div>

        <section className="mt-20">
          <Reveal>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{ui.labPage.how}</h2>
          </Reveal>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ui.labPage.flow.map((step, i) => {
              const Icon = FLOW_ICONS[i];
              return (
                <Reveal key={step.title} delay={i * 90}>
                  <li className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-mono text-xs text-white/30">0{i + 1}</span>
                    </div>
                    <h3 className="mt-5 font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">{step.body}</p>
                  </li>
                </Reveal>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
