'use client';

import { useMemo, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
// import type { SortKey } from './components/sort-control'; // if needed

type SortKey = 'default' | 'latest' | 'salary_desc' | 'salary_asc';
const VALID_SORTS: ReadonlyArray<SortKey> = [
  'default',
  'latest',
  'salary_desc',
  'salary_asc',
] as const;

/**
 * Keeps the "sort" value in sync with the URL (?sort=...).
 * - Reading is derived from the search params (single source of truth).
 * - Writing updates the URL via router.replace (no scroll, no history push).
 * - No local state/effect needed; the hook is fully derived.
 */
export function useCommittedSort() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Stable primitive for memo deps
  const searchKey = search.toString();

  // Derive current sort from the query string; fall back to 'default'.
  const sort = useMemo<SortKey>(() => {
    const raw = (search.get('sort') || 'default') as SortKey;
    return (VALID_SORTS as readonly string[]).includes(raw) ? raw : 'default';
  }, [searchKey, search]);

  /**
   * Commit a new sort to the URL:
   * - 'default' -> remove the param to keep the URL clean
   * - otherwise -> set ?sort=<value>
   */
  const setSort = useCallback(
    (next: SortKey) => {
      const params = new URLSearchParams(search);
      if (next === 'default') params.delete('sort');
      else params.set('sort', next);

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [pathname, router, searchKey, search]
  );

  return { sort, setSort } as const;
}
