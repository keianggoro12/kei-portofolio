import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// "Test" tentang Kei sendiri: tiap baris adalah klaim yang bisa dicek di CV.
const TESTS = {
  en: [
    { title: 'leads the QA team at Tempo', ms: 412 },
    { title: 'builds Playwright + TS frameworks', ms: 388 },
    { title: 'automates UI and API tests', ms: 351 },
    { title: 'writes and maintains UAT scripts', ms: 297 },
    { title: 'ships and tests 3 live apps', ms: 446 },
    { title: 'investigates bugs with product', ms: 233 },
  ],
  id: [
    { title: 'memimpin tim QA di Tempo', ms: 412 },
    { title: 'membangun framework Playwright + TS', ms: 388 },
    { title: 'mengotomasi test UI dan API', ms: 351 },
    { title: 'menulis dan merawat skrip UAT', ms: 297 },
    { title: 'merilis dan mengetes 3 aplikasi live', ms: 446 },
    { title: 'menginvestigasi bug bersama tim produk', ms: 233 },
  ],
};

const STEP_MS = 520;

export function TestTerminal({ className }: { className?: string }) {
  const { lang, ui } = useLang();
  const tests = TESTS[lang];
  const [done, setDone] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDone(tests.length);
      return;
    }
    setDone(0);
    // Mulai setelah animasi masuk hero selesai, lalu satu baris per STEP_MS.
    let count = 0;
    let timer = window.setTimeout(function tick() {
      count += 1;
      setDone(count);
      if (count < tests.length) timer = window.setTimeout(tick, STEP_MS);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [lang, tests.length]);

  const finished = done >= tests.length;
  const total = (tests.reduce((sum, t) => sum + t.ms, 0) / 1000).toFixed(1);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-white/10 bg-ink/95 font-mono text-[12.5px] leading-relaxed text-emerald-50 shadow-2xl shadow-black/40 backdrop-blur',
        className
      )}
      role="img"
      aria-label={tests.map((t) => `passed: ${t.title}`).join('. ')}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 min-w-0 text-[11px] text-white/45">~/kei $ npx playwright test {ui.terminal.title}</span>
      </div>
      <div className="space-y-1 px-4 py-3.5" aria-hidden>
        <p className="text-white/45">{ui.terminal.running}</p>
        {tests.map((test, i) => (
          <p key={test.title} className={cn('flex gap-2 transition-opacity duration-300', i < done ? 'opacity-100' : 'opacity-0')}>
            <span className="text-emerald-400">✓</span>
            <span className="hidden text-white/35 sm:inline">{i + 1}</span>
            {/* `min-w-0` agar baris bisa mengecil; di mobile judulnya turun baris. */}
            <span className="min-w-0 flex-1 sm:truncate">
              <span className="hidden text-white/45 sm:inline">Kei › </span>
              {test.title}
            </span>
            <span className="shrink-0 text-white/35">{test.ms}ms</span>
          </p>
        ))}
        <p className={cn('pt-2 transition-opacity duration-500', finished ? 'opacity-100' : 'opacity-0')}>
          <span className="font-semibold text-emerald-400">
            {tests.length} {ui.terminal.passed}
          </span>{' '}
          <span className="text-white/45">({total}s)</span>
        </p>
        <p className={cn('text-white/80 transition-opacity delay-200 duration-500', finished ? 'opacity-100' : 'opacity-0')}>
          {ui.terminal.ready}
          <span className="ml-1 inline-block h-3.5 w-2 translate-y-0.5 animate-blink bg-emerald-400" />
        </p>
      </div>
    </div>
  );
}
