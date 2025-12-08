/**
 * Hook for managing filter state from URL search params
 */

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  EventStatus,
  JoinMode,
  Level,
  MeetingKind,
} from '@/lib/api/__generated__/react-query-update';
import type { CommittedFilters } from '../types';
import { DEFAULT_DISTANCE_KM, FILTER_PARAM_KEYS } from '../constants';

const parseCsv = (sp: URLSearchParams, key: string): string[] =>
  sp
    .get(key)
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

const setCsv = (sp: URLSearchParams, key: string, values: string[]): void => {
  if (values.length > 0) {
    sp.set(key, values.join(','));
  } else {
    sp.delete(key);
  }
};

const parseBool = (sp: URLSearchParams, key: string): boolean => {
  const value = sp.get(key);
  return value === '1' || value === 'true';
};

const setBool = (sp: URLSearchParams, key: string, value: boolean): void => {
  if (value) {
    sp.set(key, '1');
  } else {
    sp.delete(key);
  }
};

export function useCommittedFilters() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state = useMemo<CommittedFilters>(() => {
    const q = search.get('q') ?? '';
    const city = search.get('city');
    const cityLat = Number.parseFloat(search.get('cityLat') ?? '');
    const cityLng = Number.parseFloat(search.get('cityLng') ?? '');
    const cityPlaceId = search.get('cityPlaceId');
    const distance = Number.parseInt(search.get('distance') ?? '');
    const distanceKm =
      Number.isFinite(distance) && distance > 0
        ? distance
        : DEFAULT_DISTANCE_KM;

    return {
      q,
      city: city || null,
      cityLat: Number.isFinite(cityLat) ? cityLat : null,
      cityLng: Number.isFinite(cityLng) ? cityLng : null,
      cityPlaceId: cityPlaceId || null,
      distanceKm,
      startISO: search.get('start') ?? null,
      endISO: search.get('end') ?? null,
      status: (search.get('status') as EventStatus) ?? EventStatus.Any,
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
      const merged: CommittedFilters = { ...state, ...next };

      const params = new URLSearchParams(search);

      for (const key of FILTER_PARAM_KEYS) {
        params.delete(key);
      }

      if (merged.q) {
        params.set('q', merged.q);
      }
      if (merged.city) {
        params.set('city', merged.city);
      }
      if (merged.cityLat !== null) {
        params.set('cityLat', String(merged.cityLat));
      }
      if (merged.cityLng !== null) {
        params.set('cityLng', String(merged.cityLng));
      }
      if (merged.cityPlaceId) {
        params.set('cityPlaceId', merged.cityPlaceId);
      }
      if (merged.distanceKm !== DEFAULT_DISTANCE_KM) {
        params.set('distance', String(merged.distanceKm));
      }
      if (merged.startISO) {
        params.set('start', merged.startISO);
      }
      if (merged.endISO) {
        params.set('end', merged.endISO);
      }
      if (merged.status !== EventStatus.Any) {
        params.set('status', merged.status);
      }

      setCsv(params, 'kinds', merged.kinds);
      setCsv(params, 'levels', merged.levels);
      setBool(params, 'verified', merged.verifiedOnly);
      setCsv(params, 'tags', merged.tags);
      setCsv(params, 'keywords', merged.keywords);
      setCsv(params, 'categories', merged.categories);
      setCsv(params, 'joinModes', merged.joinModes);

      const queryString = params.toString();
      return `${pathname}${queryString ? `?${queryString}` : ''}`;
    },
    [pathname, search, state]
  );

  const apply = useCallback(
    (next: CommittedFilters) => {
      router.replace(buildUrl(next), { scroll: false });
    },
    [buildUrl, router]
  );

  const reset = useCallback(() => {
    const defaultFilters: CommittedFilters = {
      q: '',
      city: null,
      cityLat: null,
      cityLng: null,
      cityPlaceId: null,
      distanceKm: DEFAULT_DISTANCE_KM,
      startISO: null,
      endISO: null,
      status: EventStatus.Any,
      kinds: [],
      levels: [],
      verifiedOnly: false,
      tags: [],
      keywords: [],
      categories: [],
      joinModes: [],
    };
    router.replace(buildUrl(defaultFilters), { scroll: false });
  }, [buildUrl, router]);

  console.table(state);
  return { ...state, apply, reset } as const;
}
