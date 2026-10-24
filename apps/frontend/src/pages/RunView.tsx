import type { RunDetail, RunLog, RunTest } from '@kei/shared';
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatMs, RunStatusBadge, TestStatusIcon } from '@/components/RunStatusBadge';
import { api, ApiError, artifactUrl, isActive } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const POLL_MS = 2000;
type Tab = 'steps' | 'video' | 'log' | 'report';

/** Ambil detail run + log baru tiap 2 detik selama run aktif (PRD NFR-02/03). */
function useLiveRun(runId: string) {
  const [run, setRun] = useState<RunDetail | null>(null);
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [missing, setMissing] = useState(false);
  const lastSeq = useRef(0);

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    lastSeq.current = 0;
    setLogs([]);

    const tick = async () => {
      try {
        const [detail, fresh] = await Promise.all([api.run(runId), api.logs(runId, lastSeq.current)]);
        if (!alive) return;
        setRun(detail);
        if (fresh.length) {
          lastSeq.current = fresh[fresh.length - 1].seq;
          setLogs((prev) => [...prev, ...fresh]);
        }
        // Log bisa lebih dari satu halaman (500 baris): ambil lagi segera.
        const again = fresh.length === 500 || isActive(detail.status);
        if (again) timer = window.setTimeout(tick, fresh.length === 500 ? 0 : POLL_MS);
      } catch (err) {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 404) setMissing(true);
        else timer = window.setTimeout(tick, POLL_MS * 2);
      }
    };
    void tick();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [runId]);

  return { run, logs, missing };
}

function useElapsed(run: RunDetail | null): number | null {
  const [now, setNow] = useState(Date.now());
  const active = run ? isActive(run.status) : false;
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  if (!run) return null;
  if (run.durationMs !== null && !active) return run.durationMs;
  return now - new Date(run.startedAt ?? run.createdAt).getTime();
}

function StepsPane({ test, live }: { test: RunTest; live: boolean }) {
  const { ui } = useLang();
  const shots = test.steps.filter((s) => s.screenshotKey);
  const [index, setIndex] = useState<number | null>(null);
  // Saat live, ikuti screenshot terbaru kecuali pengunjung sedang memilih sendiri.
  const current = index === null ? shots.length - 1 : Math.min(index, shots.length - 1);
  useEffect(() => setIndex(null), [test.id]);

  if (!test.steps.length) return <Empty text={ui.runner.noSteps} />;
  const shot = shots[current];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
      <div>
        {shot ? (
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <img key={shot.screenshotKey} src={artifactUrl(shot.screenshotKey!)} alt={shot.label} className="aspect-video w-full animate-fade-up object-contain [animation-duration:.3s]" />
            <button type="button" aria-label="Previous step" onClick={() => setIndex(Math.max(0, current - 1))} className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/60 hover:bg-black/80">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Next step" onClick={() => setIndex(Math.min(shots.length - 1, current + 1))} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/60 hover:bg-black/80">
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 font-mono text-xs">
              {current + 1} / {shots.length}
            </span>
          </div>
        ) : (
          <Empty text={ui.runner.noSteps} />
        )}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {shots.map((s, i) => (
            <button key={s.screenshotKey} type="button" onClick={() => setIndex(i)} aria-label={s.label} className={cn('aspect-video w-24 shrink-0 overflow-hidden rounded-lg border-2', i === current ? 'border-emerald-400' : 'border-transparent opacity-50 hover:opacity-100')}>
              <img src={artifactUrl(s.screenshotKey!)} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
            </button>
          ))}
        </div>
      </div>
      <ol className="max-h-[420px] space-y-1 overflow-y-auto text-sm">
        {test.steps.map((step, i) => {
          const shotIndex = shots.findIndex((s) => s === step);
          const isLast = live && i === test.steps.length - 1;
          return (
            <li key={`${step.index}-${i}`}>
              <button
                type="button"
                disabled={shotIndex < 0}
                onClick={() => setIndex(shotIndex)}
                className={cn('flex w-full gap-2 rounded-lg px-2 py-1.5 text-left', shotIndex === current && shotIndex >= 0 ? 'bg-white/10 text-white' : 'text-white/65 enabled:hover:bg-white/5')}
              >
                <span className="font-mono text-xs text-white/35">{String(step.index).padStart(2, '0')}</span>
                <span className="flex-1">{step.label}</span>
                {isLast && <Loader2 className="mt-0.5 h-3.5 w-3.5 animate-spin text-sky-300" />}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function LogPane({ logs }: { logs: RunLog[] }) {
  const { ui } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  useEffect(() => {
    if (stick.current && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs.length]);
  if (!logs.length) return <Empty text={ui.runner.noLog} />;
  return (
    <div
      ref={ref}
      onScroll={(e) => {
        const el = e.currentTarget;
        stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      }}
      className="max-h-[520px] overflow-y-auto rounded-2xl bg-black/60 p-4 font-mono text-[12px] leading-relaxed"
    >
      {logs.map((log) => (
        <p key={log.seq} className={cn('whitespace-pre-wrap break-words', log.level === 'error' ? 'text-red-300' : log.message.startsWith('▶') ? 'pt-2 text-emerald-300' : 'text-white/70')}>
          {log.message}
        </p>
      ))}
    </div>
  );
}

function ReportPane({ run }: { run: RunDetail }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-left text-sm">
        <tbody className="divide-y divide-white/5">
          {run.tests.map((test) => (
            <tr key={test.id} className="align-top">
              <td className="py-3 pl-4">
                <TestStatusIcon status={test.status} />
              </td>
              <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-white/45">{test.tcId}</td>
              <td className="px-3 py-3 text-white/85">
                {test.title}
                {test.error && <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-red-400/10 p-2 font-mono text-[11px] text-red-300">{test.error}</pre>}
              </td>
              <td className="whitespace-nowrap py-3 pr-4 text-right font-mono text-xs text-white/45">{formatMs(test.durationMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-white/15 text-sm text-white/45">{text}</div>;
}

export default function RunView() {
  const { runId = '' } = useParams();
  const { ui } = useLang();
  const { run, logs, missing } = useLiveRun(runId);
  const elapsed = useElapsed(run);
  const [tab, setTab] = useState<Tab>('steps');
  const [picked, setPicked] = useState<string | null>(null);

  if (missing) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink text-white">
        <div className="text-center">
          <p className="text-white/70">{ui.runner.notFound}</p>
          <Link to="/lab" className="btn mt-6 bg-emerald-400 text-ink">{ui.runner.back}</Link>
        </div>
      </div>
    );
  }

  const live = run ? isActive(run.status) : false;
  // Tanpa pilihan pengunjung: ikuti test yang sedang berjalan, atau test pertama.
  const selected = run?.tests.find((t) => t.id === picked) ?? run?.tests.find((t) => t.status === 'running') ?? run?.tests.at(-1) ?? null;
  const tabs: Tab[] = ['steps', 'video', 'log', 'report'];

  return (
    <div className="min-h-screen bg-ink pb-24 pt-24 text-white">
      <div className="container">
        <Link to="/lab" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          {ui.runner.back}
        </Link>

        <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-white/45">helpmycv / chromium · {run ? ui.runner.trigger[run.trigger] : '…'}</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Run {runId.slice(0, 8)}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {run && <RunStatusBadge status={run.status} className="text-sm" />}
            {run?.total ? (
              <span className="font-mono text-sm text-white/70">
                {run.tests.filter((t) => t.status === 'passed').length} {ui.lab.passed} · {run.tests.filter((t) => t.status !== 'running').length} {ui.runner.of} {run.total}
              </span>
            ) : null}
            <span className="font-mono text-sm text-white/45">
              {ui.runner.elapsed} {formatMs(elapsed)}
            </span>
            {run?.githubRunUrl && (
              <a href={run.githubRunUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-emerald-300 hover:text-emerald-200">
                {ui.runner.github} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </header>

        {run?.status === 'queued' && (
          <p className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            {ui.runner.queuedHint}
          </p>
        )}
        {run?.status === 'running' && run.tests.length === 0 && (
          <p className="mt-6 flex items-center gap-3 rounded-2xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm text-sky-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            {ui.runner.preparing}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
            <p className="px-2 py-2 font-mono text-xs uppercase tracking-widest text-white/45">{ui.runner.tests}</p>
            {!run && <div className="h-40 animate-pulse rounded-2xl bg-white/5" />}
            <ul className="space-y-1">
              {run?.tests.map((test) => (
                <li key={test.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(test.id)}
                    className={cn('flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition', selected?.id === test.id ? 'bg-white/10' : 'hover:bg-white/5')}
                  >
                    <TestStatusIcon status={test.status} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[11px] text-white/40">{test.tcId}</span>
                      <span className="block text-sm text-white/85">{test.title}</span>
                    </span>
                    <span className="font-mono text-[11px] text-white/40">{formatMs(test.durationMs)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="mb-4 flex gap-1 overflow-x-auto rounded-full bg-white/5 p-1" role="tablist">
              {tabs.map((key) => (
                <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={cn('flex-1 rounded-full px-4 py-2 text-sm font-medium transition', tab === key ? 'bg-white text-ink' : 'text-white/60 hover:text-white')}>
                  {ui.runner.tabs[key]}
                </button>
              ))}
            </div>
            {tab === 'steps' && (selected ? <StepsPane test={selected} live={live && selected.status === 'running'} /> : <Empty text={ui.runner.noSteps} />)}
            {tab === 'video' &&
              (selected?.videoKey ? (
                <video key={selected.videoKey} src={artifactUrl(selected.videoKey)} controls playsInline className="aspect-video w-full rounded-2xl bg-black" />
              ) : (
                <Empty text={ui.runner.noVideo} />
              ))}
            {tab === 'log' && <LogPane logs={logs} />}
            {tab === 'report' && run && <ReportPane run={run} />}
          </section>
        </div>
      </div>
    </div>
  );
}
