import type { RunStatus, TestStatus } from '@kei/shared';
import { Check, Clock, Loader2, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const STYLES: Record<RunStatus, string> = {
  queued: 'bg-amber-400/15 text-amber-300',
  running: 'bg-sky-400/15 text-sky-300',
  passed: 'bg-emerald-400/15 text-emerald-300',
  failed: 'bg-red-400/15 text-red-300',
  cancelled: 'bg-white/10 text-white/60',
  expired: 'bg-white/10 text-white/60',
};

export function RunStatusBadge({ status, className }: { status: RunStatus; className?: string }) {
  const { ui } = useLang();
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-semibold', STYLES[status], className)}>
      {status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === 'queued' && <Clock className="h-3 w-3" />}
      {status === 'passed' && <Check className="h-3 w-3" strokeWidth={3} />}
      {status === 'failed' && <X className="h-3 w-3" strokeWidth={3} />}
      {ui.runner.status[status]}
    </span>
  );
}

export function TestStatusIcon({ status }: { status: TestStatus }) {
  if (status === 'running') return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-300" />;
  return (
    <span
      className={cn(
        'grid h-5 w-5 shrink-0 place-items-center rounded-full',
        status === 'passed' && 'bg-emerald-400/20 text-emerald-300',
        status === 'failed' && 'bg-red-400/20 text-red-300',
        status === 'skipped' && 'bg-white/10 text-white/50'
      )}
    >
      {status === 'failed' ? <X className="h-3 w-3" strokeWidth={3} /> : <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  );
}

export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '–';
  return ms >= 60_000 ? `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s` : `${(ms / 1000).toFixed(1)}s`;
}
