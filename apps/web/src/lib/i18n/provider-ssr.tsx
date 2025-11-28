'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { en } from './locales/en';
import { pl } from './locales/pl';
import { de } from './locales/de';

/**
 * Supported locales
 */
export const locales = ['en', 'pl', 'de'] as const;
export type Locale = (typeof locales)[number];

/**
 * Locale display names
 */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  pl: 'Polski',
  de: 'Deutsch',
};

/**
 * All translations
 */
const translations = {
  en,
  pl,
  de,
};

export type TranslationKeys = typeof en;

/**
 * I18n Context
 */
interface I18nContextValue {
  locale: Locale;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/**
 * SSR-aware I18n Provider
 *
 * IMPORTANT: locale comes from SSR (params.locale in layout)
 * - NO localStorage
 * - NO browser detection
 * - NO useEffect to change language
 *
 * Language changes happen via navigation to new locale URL
 */
interface I18nProviderSSRProps {
  locale: Locale;
  children: ReactNode;
}

export function I18nProviderSSR({ locale, children }: I18nProviderSSRProps) {
  const value = useMemo(
    () => ({
      locale,
      t: translations[locale] as TranslationKeys,
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access i18n context
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

/**
 * Hook to get translations object
 */
export function useTranslations() {
  const { t } = useI18n();
  return t;
}
