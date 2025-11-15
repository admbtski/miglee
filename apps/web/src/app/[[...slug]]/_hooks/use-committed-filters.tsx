'use client';

import {
  IntentStatus,
  JoinMode,
  Level,
  MeetingKind,
} from '@/lib/api/__generated__/react-query-update';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export type CommittedFilters = {
  q: string;
  city: string | null;
  cityLat: number | null;
  cityLng: number | null;
  cityPlaceId: string | null;
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
  joinModes: JoinMode[];
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
    const cityLat = Number(search.get('cityLat'));
    const cityLng = Number(search.get('cityLng'));
    const cityPlaceId = search.get('cityPlaceId');
    const dist = Number(search.get('distance'));
    const distanceKm =
      Number.isFinite(dist) && dist > 0 ? dist : DEFAULT_DISTANCE;

    return {
      q,
      city: city || null,
      cityLat: Number.isFinite(cityLat) ? cityLat : null,
      cityLng: Number.isFinite(cityLng) ? cityLng : null,
      cityPlaceId: cityPlaceId || null,
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
      joinModes: parseCsv(search, 'joinModes') as JoinMode[],
    };
  }, [search]);

  const buildUrl = useCallback(
    (next: Partial<CommittedFilters>) => {
      const curr = state;

      const merged: CommittedFilters = {
        q: 'q' in next ? next.q : curr.q,
        city: 'city' in next ? next.city : curr.city,
        cityLat: 'cityLat' in next ? next.cityLat : curr.cityLat,
        cityLng: 'cityLng' in next ? next.cityLng : curr.cityLng,
        cityPlaceId:
          'cityPlaceId' in next ? next.cityPlaceId : curr.cityPlaceId,
        distanceKm: 'distanceKm' in next ? next.distanceKm : curr.distanceKm,
        startISO: 'startISO' in next ? next.startISO : curr.startISO,
        endISO: 'endISO' in next ? next.endISO : curr.endISO,
        status: ('status' in next ? next.status : curr.status) as IntentStatus,
        kinds: ('kinds' in next ? next.kinds : curr.kinds) as MeetingKind[],
        levels: ('levels' in next ? next.levels : curr.levels) as Level[],
        verifiedOnly:
          'verifiedOnly' in next ? next.verifiedOnly : curr.verifiedOnly,
        tags: 'tags' in next ? next.tags : curr.tags,
        keywords: 'keywords' in next ? next.keywords : curr.keywords,
        categories: 'categories' in next ? next.categories : curr.categories,
        joinModes: ('joinModes' in next
          ? next.joinModes
          : curr.joinModes) as JoinMode[],
      };

      const params = new URLSearchParams(search);

      // Wyczyść tylko te klucze, które obsługujemy (poprawka: 'kinds' zamiast 'types')
      for (const k of [
        'q',
        'city',
        'cityLat',
        'cityLng',
        'cityPlaceId',
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
        'joinModes',
      ]) {
        params.delete(k);
      }

      if (merged.q) params.set('q', merged.q);
      if (merged.city) params.set('city', merged.city);
      if (merged.cityLat !== null)
        params.set('cityLat', String(merged.cityLat));
      if (merged.cityLng !== null)
        params.set('cityLng', String(merged.cityLng));
      if (merged.cityPlaceId) params.set('cityPlaceId', merged.cityPlaceId);
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
      setCsv(params, 'joinModes', merged.joinModes);

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
          cityLat: null,
          cityLng: null,
          cityPlaceId: null,
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
          joinModes: [],
        }),
        { scroll: false }
      ),
    [buildUrl, router]
  );

  return { ...state, apply, reset } as const;
}
