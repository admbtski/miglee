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
  sortVars: Partial<Pick<IntentsQueryVariables, 'sortBy' | 'sortDir'>>;
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

  const isExplicitLocation =
    locationMode === 'EXPLICIT' && cityLat != null && cityLng != null;

  return useMemo<IntentsQueryVariables>(
    () => ({
      limit: INTENTS_CONFIG.DEFAULT_LIMIT,
      visibility: Visibility.Public,
      upcomingAfter: startISO ?? getUpcomingAfterDefault(),
      endingBefore: endISO ?? undefined,
      categorySlugs: categories,
      tagSlugs: tags,
      kinds: kinds.length > 0 ? kinds : undefined,
      levels: levels.length > 0 ? levels : undefined,
      joinModes: joinModes.length > 0 ? joinModes : undefined,
      keywords: [],
      status: status !== IntentStatus.Any ? status : IntentStatus.Any,
      verifiedOnly,
      ownerId: undefined,
      memberId: undefined,
      distanceKm: isExplicitLocation ? distanceKm : null,
      near: isExplicitLocation
        ? {
            lat: cityLat,
            lng: cityLng,
            cityName: city ?? undefined,
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
      isExplicitLocation,
      sortVars,
    ]
  );
}
