'use client';

import { useMemo, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Keeps the "map visible" state in sync with the URL (?map=0 or ?map=false hides it).
 * - Reading is derived from the current search params (source of truth).
 * - Writing updates the URL without scrolling (router.replace).
 * - Toggle flips the current derived state.
 */
export function useCommittedMapVisible() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Stringified search params — stable primitive for memo deps.
  const searchKey = search.toString();

  // Derive visibility from the query string: default is visible unless map=0/false.
  const mapVisible = useMemo(() => {
    const v = search.get('map');
    return !(v === '0' || v === 'false');
  }, [searchKey, search]);

  /**
   * Commit a new visibility value to the URL:
   * - visible -> remove `map` param (keeps URL clean and defaults to visible)
   * - hidden  -> set `map=0`
   * Uses replace() to avoid pushing history entries and preserves scroll.
   */
  const setVisible = useCallback(
    (next: boolean) => {
      const params = new URLSearchParams(search);
      if (next) params.delete('map');
      else params.set('map', '0');

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [pathname, router, searchKey, search]
  );

  // Convenience toggler based on the derived state.
  const toggle = useCallback(
    () => setVisible(!mapVisible),
    [setVisible, mapVisible]
  );

  return { mapVisible, toggle } as const;
}
