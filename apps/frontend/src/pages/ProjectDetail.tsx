import { projects } from '@kei/shared';
import { AlertTriangle, ArrowLeft, ArrowUpRight, Check, CircleSlash, PlayCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Reveal } from '@/components/Reveal';
import { AutomationBadge, RunReport } from '@/components/showcase';
import { useLang } from '@/lib/i18n';
import NotFound from './NotFound';

export default function ProjectDetail() {
  const { slug } = useParams();
  const { ui, t } = useLang();
  const project = projects.find((p) => p.slug === slug);
  if (!project) return <NotFound />;
  const study = project.caseStudy;

  return (
    <article className="pb-24 pt-28">
      <div className="container">
        <Link to="/#projects" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {ui.project.back}
        </Link>

        <header className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Reveal>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{project.name}</h1>
            <p className="mt-4 text-xl text-muted-foreground">{t(project.tagline)}</p>
            <p className="mt-4 leading-relaxed text-muted-foreground">{t(project.description)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={project.url} target="_blank" rel="noreferrer" className="btn-primary">
                {ui.projects.visit}
                <ArrowUpRight className="h-4 w-4" />
              </a>
              {project.hasAutomation && (
                <Link to="/lab" className="btn-ghost">
                  <PlayCircle className="h-4 w-4 text-primary" />
                  {ui.lab.open}
                </Link>
              )}
            </div>
          </Reveal>
          <Reveal delay={100} className="relative overflow-hidden rounded-3xl border bg-muted shadow-2xl shadow-primary/10">
            <img src={project.image} alt={`${project.name} screenshot`} className="aspect-[16/10] w-full object-cover object-top" />
            <AutomationBadge project={project} className="absolute left-4 top-4" />
          </Reveal>
        </header>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          <Reveal className="card p-6 sm:p-8 lg:col-span-2">
            <h2 className="font-display text-xl font-semibold">{ui.project.features}</h2>
            <ul className="mt-5 space-y-3">
              {project.features.map((f) => (
                <li key={f.en} className="flex gap-3 text-muted-foreground">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  {t(f)}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={80} className="card p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold">{ui.project.stack}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <span key={tech} className="rounded-full bg-muted px-3 py-1.5 font-mono text-xs">
                  {tech}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {study ? (
          <section className="mt-16">
            <Reveal>
              <p className="eyebrow">
                <span className="h-px w-6 bg-primary" />
                QA case study
              </p>
              <h2 className="heading mt-4">{ui.project.strategy}</h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{t(study.strategy)}</p>
            </Reveal>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <Reveal className="card p-6 sm:p-8">
                <h3 className="font-display text-lg font-semibold">{ui.project.automated}</h3>
                <ul className="mt-5 space-y-5">
                  {study.automated.map((item) => (
                    <li key={item.title.en} className="flex gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <div>
                        <p className="font-medium">{t(item.title)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t(item.why)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={80} className="card p-6 sm:p-8">
                <h3 className="font-display text-lg font-semibold">{ui.project.notAutomated}</h3>
                <ul className="mt-5 space-y-5">
                  {study.notAutomated.map((item) => (
                    <li key={item.title.en} className="flex gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                        <CircleSlash className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="font-medium">{t(item.title)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t(item.why)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <Reveal className="card mt-6 border-amber-500/30 p-6 sm:p-8">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {ui.project.findings}
              </h3>
              <ul className="mt-5 space-y-3">
                {study.risks.map((risk) => (
                  <li key={risk.en} className="text-muted-foreground">
                    {t(risk)}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="mt-6 rounded-3xl bg-ink p-4 sm:p-6">
              <RunReport />
            </Reveal>
          </section>
        ) : (
          <Reveal className="card mt-16 border-dashed p-8 text-center text-muted-foreground">{ui.project.noAutomation}</Reveal>
        )}
      </div>
    </article>
  );
}
