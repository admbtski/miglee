/**
 * Hook for managing filter state from URL search params
 */

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  IntentStatus,
  JoinMode,
} from '@/lib/api/__generated__/react-query-update';
import type { CommittedFilters } from '../_types';
import { DEFAULT_DISTANCE_KM, FILTER_PARAM_KEYS } from '../_constants';

/**
 * Parse comma-separated values from URL search params
 */
const parseCsv = (sp: URLSearchParams, key: string): string[] =>
  sp
    .get(key)
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

/**
 * Set comma-separated values in URL search params
 */
const setCsv = (sp: URLSearchParams, key: string, v: string[]): void => {
  if (v.length) {
    sp.set(key, v.join(','));
  } else {
    sp.delete(key);
  }
};

/**
 * Parse boolean value from URL search params
 */
const parseBool = (sp: URLSearchParams, key: string): boolean => {
  const v = sp.get(key);
  return v === '1' || v === 'true';
};

/**
 * Set boolean value in URL search params
 */
const setBool = (sp: URLSearchParams, key: string, val: boolean): void => {
  if (val) {
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
    const cityLat = Number(search.get('cityLat'));
    const cityLng = Number(search.get('cityLng'));
    const cityPlaceId = search.get('cityPlaceId');
    const dist = Number(search.get('distance'));
    const distanceKm =
      Number.isFinite(dist) && dist > 0 ? dist : DEFAULT_DISTANCE_KM;

    return {
      q,
      city: city || null,
      cityLat: Number.isFinite(cityLat) ? cityLat : null,
      cityLng: Number.isFinite(cityLng) ? cityLng : null,
      cityPlaceId: cityPlaceId || null,
      distanceKm,
      startISO: search.get('start') ?? null,
      endISO: search.get('end') ?? null,
      status: (search.get('status') as IntentStatus) ?? IntentStatus.Any,
      kinds: parseCsv(search, 'kinds') as any,
      levels: parseCsv(search, 'levels') as any,
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
        q: next.q !== undefined ? next.q : curr.q,
        city: next.city !== undefined ? next.city : curr.city,
        cityLat: next.cityLat !== undefined ? next.cityLat : curr.cityLat,
        cityLng: next.cityLng !== undefined ? next.cityLng : curr.cityLng,
        cityPlaceId:
          next.cityPlaceId !== undefined ? next.cityPlaceId : curr.cityPlaceId,
        distanceKm:
          next.distanceKm !== undefined ? next.distanceKm : curr.distanceKm,
        startISO: next.startISO !== undefined ? next.startISO : curr.startISO,
        endISO: next.endISO !== undefined ? next.endISO : curr.endISO,
        status: next.status !== undefined ? next.status : curr.status,
        kinds: next.kinds !== undefined ? next.kinds : curr.kinds,
        levels: next.levels !== undefined ? next.levels : curr.levels,
        verifiedOnly:
          next.verifiedOnly !== undefined
            ? next.verifiedOnly
            : curr.verifiedOnly,
        tags: next.tags !== undefined ? next.tags : curr.tags,
        keywords: next.keywords !== undefined ? next.keywords : curr.keywords,
        categories:
          next.categories !== undefined ? next.categories : curr.categories,
        joinModes:
          next.joinModes !== undefined ? next.joinModes : curr.joinModes,
      };

      const params = new URLSearchParams(search);

      // Clear only the keys we manage
      for (const k of FILTER_PARAM_KEYS) {
        params.delete(k);
      }

      if (merged.q) params.set('q', merged.q);
      if (merged.city) params.set('city', merged.city);
      if (merged.cityLat !== null)
        params.set('cityLat', String(merged.cityLat));
      if (merged.cityLng !== null)
        params.set('cityLng', String(merged.cityLng));
      if (merged.cityPlaceId) params.set('cityPlaceId', merged.cityPlaceId);
      if (merged.distanceKm !== DEFAULT_DISTANCE_KM)
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
          distanceKm: DEFAULT_DISTANCE_KM,
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
