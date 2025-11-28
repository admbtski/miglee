'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { en } from './locales/en';
import { pl } from './locales/pl';
import { de } from './locales/de';
import type { Translations } from './locales/en';

export type Locale = 'en' | 'pl' | 'de';

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
};

const I18nContext = createContext<I18nContextType | null>(null);

const translations: Record<Locale, Translations> = {
  en,
  pl,
  de,
};

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pl: 'Polski',
  de: 'Deutsch',
};

function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  const browserLang = navigator.language.toLowerCase();

  if (browserLang.startsWith('pl')) return 'pl';
  if (browserLang.startsWith('de')) return 'de';
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  // Load locale from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('locale') as Locale | null;
      if (stored && (stored === 'en' || stored === 'pl' || stored === 'de')) {
        setLocaleState(stored);
      } else {
        // Use browser locale as fallback
        const browserLocale = getBrowserLocale();
        setLocaleState(browserLocale);
      }
    } catch {}
    setMounted(true);
  }, []);

  // Save locale to localStorage when it changes
  useEffect(() => {
    if (!mounted) return;

    try {
      localStorage.setItem('locale', locale);
      // Update document lang attribute
      document.documentElement.lang = locale;
    } catch {}
  }, [locale, mounted]);

  const value = useMemo<I18nContextType>(
    () => ({
      locale,
      setLocale: (newLocale: Locale) => setLocaleState(newLocale),
      t: translations[locale],
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

// Helper hook for translations only
export function useTranslations() {
  const { t } = useI18n();
  return t;
}
