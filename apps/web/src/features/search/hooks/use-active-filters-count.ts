'use client';

import { EventStatus } from '@/lib/api/__generated__/react-query-update';
import { useMemo } from 'react';
import { DEFAULT_DISTANCE_KM } from '../constants';
import type { CommittedFilters } from '../types';

export function useActiveFiltersCount(filters: CommittedFilters): number {
  return useMemo(() => {
    let count = 0;

    if (filters.q) count++;
    if (filters.city) count++;
    if (filters.distanceKm !== DEFAULT_DISTANCE_KM) count++;
    if (filters.startISO) count++;
    if (filters.endISO) count++;
    if (filters.status && filters.status !== EventStatus.Any) count++;
    if (filters.kinds.length) count++;
    if (filters.levels.length) count++;
    if (filters.verifiedOnly) count++;
    if (filters.tags.length) count++;
    if (filters.keywords.length) count++;
    if (filters.categories.length) count++;
    if (filters.joinModes.length) count++;

    return count;
  }, [
    filters.q,
    filters.city,
    filters.distanceKm,
    filters.startISO,
    filters.endISO,
    filters.status,
    filters.kinds,
    filters.levels,
    filters.verifiedOnly,
    filters.tags,
    filters.keywords,
    filters.categories,
    filters.joinModes,
  ]);
}
