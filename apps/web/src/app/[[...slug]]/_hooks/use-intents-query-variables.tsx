/**
 * Hook for building GraphQL query variables for intents search
 */

'use client';

import { useMemo } from 'react';
import {
  IntentStatus,
  Visibility,
} from '@/lib/api/__generated__/react-query-update';
import {
  getUpcomingAfterDefault,
  INTENTS_CONFIG,
} from '@/lib/constants/intents';
import type {
  CommittedFilters,
  IntentsQueryVariables,
  LocationMode,
} from '../_types';

type UseIntentsQueryVariablesParams = {
  filters: CommittedFilters;
  locationMode: LocationMode;
  sortVars: Record<string, any>;
};

/**
 * Builds GraphQL query variables for fetching intents based on filters and location mode
 *
 * @param params - Filters, location mode, and sort variables
 * @returns Query variables ready for useIntentsInfiniteQuery
 *
 * @example
 * ```tsx
 * const variables = useIntentsQueryVariables({
 *   filters,
 *   locationMode: 'EXPLICIT',
 *   sortVars: { sortBy: 'START_AT', sortDir: 'ASC' }
 * });
 * ```
 */
export function useIntentsQueryVariables({
  filters,
  locationMode,
  sortVars,
}: UseIntentsQueryVariablesParams): IntentsQueryVariables {
  const {
    startISO,
    endISO,
    categories,
    tags,
    kinds,
    levels,
    joinModes,
    status,
    verifiedOnly,
    city,
    cityLat,
    cityLng,
    cityPlaceId,
    distanceKm,
  } = filters;

  return useMemo<IntentsQueryVariables>(
    () => ({
      limit: INTENTS_CONFIG.DEFAULT_LIMIT,
      visibility: Visibility.Public,
      upcomingAfter: startISO ?? getUpcomingAfterDefault(),
      endingBefore: endISO,
      categorySlugs: categories ?? [],
      tagSlugs: tags,
      kinds: kinds.length ? kinds : [],
      levels: levels.length ? levels : [],
      joinModes: joinModes.length ? joinModes : [],
      keywords: [],
      status: status !== IntentStatus.Any ? status : IntentStatus.Any,
      verifiedOnly: !!verifiedOnly,
      ownerId: undefined,
      memberId: undefined,
      // Only filter by distance in EXPLICIT mode
      distanceKm: locationMode === 'EXPLICIT' ? distanceKm : null,
      near:
        locationMode === 'EXPLICIT' && cityLat != null && cityLng != null
          ? {
              lat: cityLat,
              lng: cityLng,
              cityName: city,
              cityPlaceId: cityPlaceId ?? undefined,
            }
          : undefined,
      ...sortVars,
    }),
    [
      startISO,
      endISO,
      categories,
      tags,
      kinds,
      levels,
      joinModes,
      status,
      verifiedOnly,
      city,
      cityLat,
      cityLng,
      cityPlaceId,
      distanceKm,
      locationMode,
      sortVars,
    ]
  );
}
