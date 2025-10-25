'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

type Ctx = {
  theme: ThemeChoice;
  resolvedTheme: Resolved;
  setTheme: (t: ThemeChoice) => void;
  toggle: () => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

function getSystemPref(): Resolved {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyToDOM(choice: ThemeChoice) {
  const system = getSystemPref();
  const resolved: Resolved = choice === 'system' ? system : choice;
  const el = document.documentElement;
  el.classList.toggle('dark', resolved === 'dark');
  el.dataset.theme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const ls =
        (localStorage.getItem('theme') as ThemeChoice | null) ?? 'system';
      setThemeState(ls);
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    applyToDOM(theme);

    try {
      if (theme === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', theme);
    } catch {}

    let mql: MediaQueryList | null = null;
    const onChange = () => {
      if (theme === 'system') applyToDOM('system');
    };

    if (theme === 'system' && typeof window !== 'undefined') {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener?.('change', onChange);
      // Safari <14
      // @ts-ignore
      mql.addListener?.(onChange);
    }

    return () => {
      if (mql) {
        mql.removeEventListener?.('change', onChange);
        // @ts-ignore
        mql.removeListener?.(onChange);
      }
    };
  }, [theme, mounted]);

  const value = useMemo<Ctx>(() => {
    const resolved: Resolved = theme === 'system' ? getSystemPref() : theme;
    return {
      theme,
      resolvedTheme: resolved,
      setTheme: (t) => setThemeState(t),
      toggle: () =>
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    };
  }, [theme]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
