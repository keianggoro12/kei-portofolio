import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Muncul pelan saat masuk viewport. Tanpa IntersectionObserver langsung tampil. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn('transition duration-700 ease-out', shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0', className)}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, className }: { eyebrow: string; title: string; subtitle?: string; className?: string }) {
  return (
    <Reveal className={cn('max-w-2xl', className)}>
      <p className="eyebrow">
        <span className="h-px w-6 bg-primary" />
        {eyebrow}
      </p>
      <h2 className="heading mt-4 text-balance">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-muted-foreground text-pretty">{subtitle}</p>}
    </Reveal>
  );
}
