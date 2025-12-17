/**
 * Hook for managing map visibility state from URL search params
 */

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

const buildUrl = (pathname: string, params: URLSearchParams): string =>
  `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;

/**
 * Manages map visibility state from URL search params
 * Map is visible by default unless explicitly set to false
 *
 * @returns Object with mapVisible state, setVisible setter, and toggle function
 *
 * @example
 * ```tsx
 * const { mapVisible, toggle } = useCommittedMapVisible();
 * // mapVisible: true (default)
 * // toggle() -> sets map=0 in URL
 * ```
 */
export function useCommittedMapVisible() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const mapVisible = useMemo(() => {
    const v = search.get('map');
    return !(v === '0' || v === 'false');
  }, [search]);

  const setVisible = useCallback(
    (next: boolean) => {
      const params = new URLSearchParams(search);
      if (next) params.delete('map');
      else params.set('map', '0');
      router.replace(buildUrl(pathname, params), { scroll: false });
    },
    [pathname, router, search]
  );

  const toggle = useCallback(
    () => setVisible(!mapVisible),
    [setVisible, mapVisible]
  );

  return useMemo(
    () => ({ mapVisible, setVisible, toggle }),
    [mapVisible, setVisible, toggle]
  );
}
