'use client';

import { useMemo } from 'react';
import type { CommittedFilters } from './use-committed-filters';
import { IntentStatus } from '@/lib/api/__generated__/react-query-update';
import { INTENTS_CONFIG } from '@/lib/constants/intents';

/**
 * Calculates the number of active filters
 * Used to display filter count badge in UI
 *
 * @param filters - Current filter state from URL params
 * @returns Number of active filters
 */
export function useActiveFiltersCount(filters: CommittedFilters): number {
  return useMemo(() => {
    let count = 0;

    if (filters.q) count++;
    if (filters.city) count++;
    if (filters.distanceKm !== INTENTS_CONFIG.DEFAULT_DISTANCE_KM) count++;
    if (filters.startISO) count++;
    if (filters.endISO) count++;
    if (filters.status && filters.status !== IntentStatus.Any) count++;
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
