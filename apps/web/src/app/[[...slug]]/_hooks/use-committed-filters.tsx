'use client';

import {
  IntentStatus,
  Level,
  MeetingKind,
} from '@/lib/graphql/__generated__/react-query-update';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export type CommittedFilters = {
  q: string;
  city: string | null;
  distanceKm: number;
  startISO: string | null;
  endISO: string | null;
  status: IntentStatus;
  kinds: MeetingKind[];
  levels: Level[];
  verifiedOnly: boolean;
  tags: string[];
  keywords: string[];
  categories: string[];
};

const DEFAULT_DISTANCE = 30;

const parseCsv = (sp: URLSearchParams, key: string) =>
  (sp
    .get(key)
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? []) as string[];
const setCsv = (sp: URLSearchParams, key: string, v: string[]) =>
  v.length ? sp.set(key, v.join(',')) : sp.delete(key);

const parseBool = (sp: URLSearchParams, key: string) => {
  const v = sp.get(key);
  return v === '1' || v === 'true';
};
const setBool = (sp: URLSearchParams, key: string, val: boolean) =>
  val ? sp.set(key, '1') : sp.delete(key);

export function useCommittedFilters() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state = useMemo<CommittedFilters>(() => {
    const q = search.get('q') ?? '';
    const city = search.get('city');
    const dist = Number(search.get('distance'));
    const distanceKm =
      Number.isFinite(dist) && dist > 0 ? dist : DEFAULT_DISTANCE;

    return {
      q,
      city: city || null,
      distanceKm,
      startISO: search.get('start') ?? null,
      endISO: search.get('end') ?? null,
      status: ((search.get('status') as IntentStatus) ??
        IntentStatus.Any) as IntentStatus,
      kinds: parseCsv(search, 'kinds') as MeetingKind[],
      levels: parseCsv(search, 'levels') as Level[],
      verifiedOnly: parseBool(search, 'verified'),
      tags: parseCsv(search, 'tags'),
      keywords: parseCsv(search, 'keywords'),
      categories: parseCsv(search, 'categories'),
    };
  }, [search]);

  const buildUrl = useCallback(
    (next: Partial<CommittedFilters>) => {
      const curr = state;

      const merged: CommittedFilters = {
        q: next.q ?? curr.q,
        city: next.city ?? curr.city,
        distanceKm: next.distanceKm ?? curr.distanceKm,
        startISO: next.startISO ?? curr.startISO,
        endISO: next.endISO ?? curr.endISO,
        status: (next.status ?? curr.status) as IntentStatus,
        kinds: (next.kinds ?? curr.kinds) as MeetingKind[],
        levels: (next.levels ?? curr.levels) as Level[],
        verifiedOnly: next.verifiedOnly ?? curr.verifiedOnly,
        tags: next.tags ?? curr.tags,
        keywords: next.keywords ?? curr.keywords,
        categories: next.categories ?? curr.categories,
      };

      const params = new URLSearchParams(search);

      // Wyczyść tylko te klucze, które obsługujemy (poprawka: 'kinds' zamiast 'types')
      for (const k of [
        'q',
        'city',
        'distance',
        'start',
        'end',
        'status',
        'kinds',
        'levels',
        'verified',
        'tags',
        'keywords',
        'categories',
      ]) {
        params.delete(k);
      }

      if (merged.q) params.set('q', merged.q);
      if (merged.city) params.set('city', merged.city);
      if (merged.distanceKm !== DEFAULT_DISTANCE)
        params.set('distance', String(merged.distanceKm));
      if (merged.startISO) params.set('start', merged.startISO);
      if (merged.endISO) params.set('end', merged.endISO);
      if (merged.status !== IntentStatus.Any)
        params.set('status', merged.status);

      setCsv(params, 'kinds', merged.kinds);
      setCsv(params, 'levels', merged.levels);
      setBool(params, 'verified', merged.verifiedOnly);
      setCsv(params, 'tags', merged.tags);
      setCsv(params, 'keywords', merged.keywords);
      setCsv(params, 'categories', merged.categories);

      const qs = params.toString();
      return `${pathname}${qs ? `?${qs}` : ''}`;
    },
    [pathname, search, state]
  );

  const apply = useCallback(
    (next: CommittedFilters) =>
      router.replace(buildUrl(next), { scroll: false }),
    [buildUrl, router]
  );

  const reset = useCallback(
    () =>
      router.replace(
        buildUrl({
          q: '',
          city: null,
          distanceKm: DEFAULT_DISTANCE,
          startISO: null,
          endISO: null,
          status: IntentStatus.Any,
          kinds: [],
          levels: [],
          verifiedOnly: false,
          tags: [],
          keywords: [],
          categories: [],
        }),
        { scroll: false }
      ),
    [buildUrl, router]
  );

  return { ...state, apply, reset } as const;
}
