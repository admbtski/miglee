// lib/geocode.ts
'use client';

import { loadGoogleMaps } from './googleMaps';

export async function reverseGeocode(
  latLng: google.maps.LatLngLiteral
): Promise<{
  formattedAddress?: string;
  placeId?: string;
}> {
  const g = await loadGoogleMaps();

  return new Promise((resolve, reject) => {
    const geocoder = new g.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status !== g.maps.GeocoderStatus.OK || !results || !results.length) {
        resolve({}); // brak adresu — nie traktuj jako błąd krytyczny
        return;
      }
      const top = results[0];
      resolve({
        formattedAddress: top.formatted_address,
        placeId: top.place_id,
      });
    });
  });
}
