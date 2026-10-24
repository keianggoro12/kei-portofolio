import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

/** Tema awal dipasang di index.html; hook ini hanya membaca dan mengganti. */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', next);
      } catch {
        // abaikan
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
