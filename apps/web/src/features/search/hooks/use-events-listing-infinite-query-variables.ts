'use client';

import {
  EventStatus,
  GetEventsListingQueryVariables,
  Visibility,
} from '@/lib/api/__generated__/react-query-update';
import { EVENTS_CONFIG, getUpcomingAfterDefault } from '@/lib/constants/events';
import { useMemo } from 'react';
import type { CommittedFilters, LocationMode } from '../types';

type UseEventsListingInfiniteQueryVariablesParams = {
  filters: CommittedFilters;
  locationMode: LocationMode;
  sortVars: Partial<Pick<GetEventsListingQueryVariables, 'sortBy' | 'sortDir'>>;
};

export function useEventsListingInfiniteQueryVariables({
  filters,
  locationMode,
  sortVars,
}: UseEventsListingInfiniteQueryVariablesParams): GetEventsListingQueryVariables {
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

  return useMemo<GetEventsListingQueryVariables>(
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
