// lib/geocode.ts
'use client';

import { loadGoogleMaps } from './googleMaps';

/**
 * Reverse-geocodes coordinates into a formatted address.
 * Returns an object with optional formattedAddress and placeId.
 */
export async function reverseGeocode(
  latLng: google.maps.LatLngLiteral
): Promise<{ formattedAddress?: string; placeId?: string }> {
  const g = await loadGoogleMaps();

  return new Promise((resolve) => {
    const geocoder = new g.maps.Geocoder();

    geocoder.geocode({ location: latLng }, (results, status) => {
      const ok = status === g.maps.GeocoderStatus.OK;

      if (!ok || !results?.length) {
        resolve({});
        return;
      }

      const top = results[0]!;
      resolve({
        formattedAddress: top.formatted_address,
        placeId: top.place_id,
      });
    });
  });
}

/**
 * Convenience wrapper that returns only the address string.
 */
export async function reverseGeocodeLatLng(
  lat: number,
  lng: number
): Promise<string | undefined> {
  const data = await reverseGeocode({ lat, lng });
  return data.formattedAddress;
}
