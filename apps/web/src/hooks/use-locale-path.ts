'use client';

import { useI18n } from '@/lib/i18n/provider-ssr';

/**
 * Hook for creating locale-aware links
 *
 * Usage:
 * ```tsx
 * const { localePath } = useLocalePath();
 * <Link href={localePath('/event/123')}>View Event</Link>
 * ```
 */
export function useLocalePath() {
  const { locale } = useI18n();

  /**
   * Prepend current locale to a path
   *
   * @param path - Path without locale (e.g., '/event/123')
   * @returns Path with locale (e.g., '/pl/event/123')
   */
  const localePath = (path: string): string => {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `/${locale}${normalizedPath}`;
  };

  /**
   * Get path for a different locale
   *
   * @param path - Path without locale
   * @param targetLocale - Target locale
   * @returns Path with target locale
   */
  const localePathFor = (path: string, targetLocale: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `/${targetLocale}${normalizedPath}`;
  };

  return {
    locale,
    localePath,
    localePathFor,
  };
}
