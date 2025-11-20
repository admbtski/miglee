'use client';

import { loadGoogleMaps } from './googleMaps';
import type { NormalizedPlace } from '../hooks/use-places-autocomplete';

export type CityInfo = {
  cityName?: string;
  cityPlaceId?: string;
};

/**
 * Extracts city information from a normalized Place object.
 *
 * Logic:
 * 1. If place.types contains 'locality' → treat as city itself
 * 2. Otherwise, search addressComponents for locality/postal_town/administrative_area
 *
 * @param place - Normalized place object with types and addressComponents
 * @returns City name and placeId (if place is a locality)
 */
export function extractCityFromPlace(place: NormalizedPlace): CityInfo {
  const { types, addressComponents, displayName, formattedAddress, placeId } =
    place;

  // Case 1: Place itself is a locality (city)
  if (types && types.includes('locality')) {
    return {
      cityName: displayName || formattedAddress || undefined,
      cityPlaceId: placeId,
    };
  }

  // Case 2: Extract city from address components
  if (!addressComponents || addressComponents.length === 0) {
    return {};
  }

  // Priority order for city component types
  const cityTypes = [
    'locality',
    'postal_town',
    'administrative_area_level_2',
    'administrative_area_level_3',
  ];

  for (const cityType of cityTypes) {
    const component = addressComponents.find((comp) =>
      comp.types.includes(cityType)
    );

    if (component) {
      const cityName = component.longText || component.shortText || undefined;
      return {
        cityName,
        cityPlaceId: undefined, // Will be resolved in next step if needed
      };
    }
  }

  return {};
}

/**
 * Resolves a city's Place ID by searching for it using autocomplete.
 * This is a "best effort" operation - if it fails, it won't throw.
 *
 * @param cityName - Name of the city to search for
 * @returns City's Place ID or undefined
 */
export async function resolveCityPlaceId(
  cityName: string
): Promise<string | undefined> {
  try {
    const g = await loadGoogleMaps();
    const { AutocompleteSuggestion } = (await g.maps.importLibrary(
      'places'
    )) as google.maps.PlacesLibrary;

    const request: google.maps.places.AutocompleteRequest = {
      input: cityName,
      includedPrimaryTypes: ['locality'],
      language: 'pl',
      region: 'PL',
    };

    const { suggestions } =
      await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

    if (!suggestions || suggestions.length === 0) {
      return undefined;
    }

    // Take first suggestion's placeId
    const firstSuggestion = suggestions[0];
    const cityPlaceId = firstSuggestion?.placePrediction?.placeId;

    return cityPlaceId || undefined;
  } catch (error) {
    // Best effort - don't block user on error
    console.warn('Failed to resolve city placeId:', error);
    return undefined;
  }
}

/**
 * Complete city resolution: extract from place + optionally lookup placeId
 *
 * @param place - Normalized place object
 * @returns Complete city info with name and placeId
 */
export async function resolveCityInfo(
  place: NormalizedPlace
): Promise<CityInfo> {
  const { cityName, cityPlaceId: cityPidFromTypes } =
    extractCityFromPlace(place);

  // If we already have cityPlaceId from types, return immediately
  if (cityPidFromTypes) {
    return { cityName, cityPlaceId: cityPidFromTypes };
  }

  // If we have cityName but no placeId, try to resolve it
  if (cityName && !cityPidFromTypes) {
    try {
      const resolvedPlaceId = await resolveCityPlaceId(cityName);
      return { cityName, cityPlaceId: resolvedPlaceId };
    } catch (error) {
      // Best effort - return what we have
      console.warn('Failed to resolve city placeId:', error);
      return { cityName, cityPlaceId: undefined };
    }
  }

  // No city info available
  return { cityName, cityPlaceId: cityPidFromTypes };
}
