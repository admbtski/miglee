'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  IntentsSortBy,
  SortDir,
} from '@/lib/api/__generated__/react-query-update';
import type { GetIntentsQueryVariables } from '@/lib/api/__generated__/react-query-update';

export type SortKey =
  | 'default'
  | 'start_asc'
  | 'start_desc'
  | 'created_desc'
  | 'created_asc'
  | 'updated_desc'
  | 'members_desc'
  | 'members_asc';

const VALID_SORTS = new Set<SortKey>([
  'default',
  'start_asc',
  'start_desc',
  'created_desc',
  'created_asc',
  'updated_desc',
  'members_desc',
  'members_asc',
]);

const buildUrl = (pathname: string, params: URLSearchParams) =>
  `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;

/** Mapowanie klucza UI -> GQL {sortBy, sortDir} */
export function mapSortKeyToGql(
  key: SortKey
): Pick<GetIntentsQueryVariables, 'sortBy' | 'sortDir'> | {} {
  switch (key) {
    case 'start_asc':
      return { sortBy: IntentsSortBy.StartAt, sortDir: SortDir.Asc };
    case 'start_desc':
      return { sortBy: IntentsSortBy.StartAt, sortDir: SortDir.Desc };
    case 'created_desc':
      return { sortBy: IntentsSortBy.CreatedAt, sortDir: SortDir.Desc };
    case 'created_asc':
      return { sortBy: IntentsSortBy.CreatedAt, sortDir: SortDir.Asc };
    case 'updated_desc':
      return { sortBy: IntentsSortBy.UpdatedAt, sortDir: SortDir.Desc };
    case 'members_desc':
      return { sortBy: IntentsSortBy.MembersCount, sortDir: SortDir.Desc };
    case 'members_asc':
      return { sortBy: IntentsSortBy.MembersCount, sortDir: SortDir.Asc };
    case 'default':
    default:
      // Brak wymuszonego sortowania – backendowy default
      return {};
  }
}

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

  const sortVars = useMemo(() => mapSortKeyToGql(sort), [sort]) as
    | Pick<GetIntentsQueryVariables, 'sortBy' | 'sortDir'>
    | {};

  return useMemo(
    () => ({ sort, setSort, sortVars }),
    [sort, setSort, sortVars]
  );
}
