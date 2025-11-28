/**
 * Hook for managing location mode and map center
 */

'use client';

import { useMemo } from 'react';
import type { LocationMode, MapCenter } from '../_types';

type UseLocationModeParams = {
  city: string | null;
  cityLat: number | null;
  cityLng: number | null;
  userHomeLat?: number | null;
  userHomeLng?: number | null;
};

type UseLocationModeReturn = {
  locationMode: LocationMode;
  mapCenter: MapCenter;
};

/**
 * Determines the location mode and calculates map center based on filters and user profile
 *
 * @param params - Location parameters from filters and user profile
 * @returns Location mode and map center coordinates
 *
 * @example
 * ```tsx
 * const { locationMode, mapCenter } = useLocationMode({
 *   city: 'Warsaw',
 *   cityLat: 52.2297,
 *   cityLng: 21.0122,
 *   userHomeLat: null,
 *   userHomeLng: null,
 * });
 * // locationMode: 'EXPLICIT'
 * // mapCenter: { lat: 52.2297, lng: 21.0122 }
 * ```
 */
export function useLocationMode({
  city,
  cityLat,
  cityLng,
  userHomeLat,
  userHomeLng,
}: UseLocationModeParams): UseLocationModeReturn {
  // Determine location mode
  const locationMode = useMemo<LocationMode>(() => {
    // EXPLICIT: User has set location in filters
    if (city && cityLat != null && cityLng != null) {
      return 'EXPLICIT';
    }
    // PROFILE_DEFAULT: User has home location in profile
    if (userHomeLat != null && userHomeLng != null) {
      return 'PROFILE_DEFAULT';
    }
    // NONE: No location available
    return 'NONE';
  }, [city, cityLat, cityLng, userHomeLat, userHomeLng]);

  // Map center based on location mode
  const mapCenter = useMemo<MapCenter>(() => {
    if (locationMode === 'EXPLICIT' && cityLat != null && cityLng != null) {
      return { lat: cityLat, lng: cityLng };
    }
    if (
      locationMode === 'PROFILE_DEFAULT' &&
      userHomeLat != null &&
      userHomeLng != null
    ) {
      return { lat: userHomeLat, lng: userHomeLng };
    }
    return null; // NONE mode - map will handle fitBounds or default view
  }, [locationMode, cityLat, cityLng, userHomeLat, userHomeLng]);

  return { locationMode, mapCenter };
}
