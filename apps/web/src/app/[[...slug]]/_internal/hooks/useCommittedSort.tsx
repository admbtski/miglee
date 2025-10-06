'use client';

import { useMemo, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type SortKey = 'default' | 'latest' | 'salary_desc' | 'salary_asc';
const VALID_SORTS = new Set<SortKey>([
  'default',
  'latest',
  'salary_desc',
  'salary_asc',
]);

const buildUrl = (pathname: string, params: URLSearchParams) =>
  `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;

export function useCommittedSort() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const sort = useMemo<SortKey>(() => {
    const raw = (search.get('sort') ?? 'default') as SortKey;
    return VALID_SORTS.has(raw) ? raw : 'default';
  }, [search]);

  const setSort = useCallback(
    (next: SortKey) => {
      const params = new URLSearchParams(search);
      if (next === 'default') params.delete('sort');
      else params.set('sort', next);
      router.replace(buildUrl(pathname, params), { scroll: false });
    },
    [pathname, router, search]
  );

  return { sort, setSort } as const;
}
