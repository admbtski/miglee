// lib/places.ts
'use client';

import { importPlaces } from './googleMaps';

/**
 * Retrieves place details using the new Places API (New).
 * Modern replacement for deprecated `PlacesService.getDetails`.
 */
export async function getPlaceDetailsById(
  placeId: string,
  opts?: { language?: string; region?: string }
): Promise<{
  lat: number;
  lng: number;
  formattedAddress: string;
  displayName?: string;
  id?: string;
}> {
  const places = await importPlaces();

  // Create a Place instance and fetch only necessary fields
  const place = new places.Place({
    id: placeId,
    requestedLanguage: opts?.language ?? null,
    requestedRegion: opts?.region ?? null,
  });

  await place.fetchFields({
    fields: ['location', 'formattedAddress', 'id', 'displayName'],
  });

  const loc = place.location;
  if (!loc) throw new Error('Place has no location.');

  return {
    lat: loc.lat(),
    lng: loc.lng(),
    formattedAddress: place.formattedAddress ?? '',
    displayName: (place as any).displayName,
    id: (place as any).id,
  };
}
