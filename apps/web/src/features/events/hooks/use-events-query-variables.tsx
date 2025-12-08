/**
 * Hook for building GraphQL query variables for events search
 */

'use client';

import { useMemo } from 'react';
import {
  EventStatus,
  Visibility,
} from '@/lib/api/__generated__/react-query-update';
import { getUpcomingAfterDefault, EVENTS_CONFIG } from '@/lib/constants/events';
import type {
  CommittedFilters,
  EventsQueryVariables,
  LocationMode,
} from '../types';

type UseEventsQueryVariablesParams = {
  filters: CommittedFilters;
  locationMode: LocationMode;
  sortVars: Partial<Pick<EventsQueryVariables, 'sortBy' | 'sortDir'>>;
};

/**
 * Builds GraphQL query variables for fetching events based on filters and location mode
 *
 * @param params - Filters, location mode, and sort variables
 * @returns Query variables ready for useEventsInfiniteQuery
 *
 * @example
 * ```tsx
 * const variables = useEventsQueryVariables({
 *   filters,
 *   locationMode: 'EXPLICIT',
 *   sortVars: { sortBy: 'START_AT', sortDir: 'ASC' }
 * });
 * ```
 */
export function useEventsQueryVariables({
  filters,
  locationMode,
  sortVars,
}: UseEventsQueryVariablesParams): EventsQueryVariables {
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

  // When status is not ANY, backend handles time filtering based on status
  // Only use upcomingAfter/endingBefore when status is ANY
  const shouldUseTimeFilters = status === EventStatus.Any;

  return useMemo<EventsQueryVariables>(
    () => ({
      limit: EVENTS_CONFIG.DEFAULT_LIMIT,
      visibility: Visibility.Public,
      // Only pass time filters when status is ANY
      // When status is UPCOMING/ONGOING/PAST, backend handles time logic
      upcomingAfter: shouldUseTimeFilters
        ? (startISO ?? getUpcomingAfterDefault())
        : undefined,
      endingBefore: shouldUseTimeFilters ? (endISO ?? undefined) : undefined,
      categorySlugs: categories,
      tagSlugs: tags,
      kinds: kinds.length > 0 ? kinds : undefined,
      levels: levels.length > 0 ? levels : undefined,
      joinModes: joinModes.length > 0 ? joinModes : undefined,
      keywords: [],
      status,
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
      shouldUseTimeFilters,
    ]
  );
}
