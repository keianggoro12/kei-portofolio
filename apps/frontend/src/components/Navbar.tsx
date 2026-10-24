import { Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('group flex items-center gap-2.5 font-display text-lg font-bold tracking-tight', className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)] transition group-hover:rotate-[-6deg] dark:text-primary">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      </span>
      <span>
        kei<span className="text-primary">.qa</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const { ui, lang, setLang } = useLang();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Halaman QA Lab selalu gelap; navbar transparan di atasnya tidak terbaca di tema light.
  const solid = useLocation().pathname.startsWith('/lab');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/#about', label: ui.nav.about },
    { href: '/#experience', label: ui.nav.experience },
    { href: '/#projects', label: ui.nav.projects },
    { href: '/lab', label: ui.nav.lab },
    { href: '/#contact', label: ui.nav.contact },
  ];

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled || open || solid ? 'border-b bg-background/80 backdrop-blur-xl' : 'border-b border-transparent'
      )}
    >
      <nav className="container flex h-16 items-center justify-between gap-4">
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link to={link.href} className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <div className="flex rounded-full border bg-card/60 p-0.5 text-xs font-semibold" role="group" aria-label="Language">
            {(['en', 'id'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={cn(
                  'rounded-full px-2.5 py-1 uppercase transition',
                  lang === code ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {code}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="grid h-9 w-9 place-items-center rounded-full border bg-card/60 text-muted-foreground transition hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/#contact" className="btn-primary hidden px-4 py-2 lg:inline-flex">
            {ui.nav.hire}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-full border bg-card/60 md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <ul className="container grid gap-1 pb-4 md:hidden">
          {links.map((link) => (
            <li key={link.href}>
              <Link to={link.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 font-medium hover:bg-muted">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
