// lib/places.ts
import { loadGoogleMaps } from './googleMaps';

export async function getPlaceDetailsById(
  placeId: string,
  sessionToken?: google.maps.places.AutocompleteSessionToken
): Promise<{
  lat: number;
  lng: number;
  formattedAddress: string;
}> {
  const g = await loadGoogleMaps();

  return new Promise((resolve, reject) => {
    const dummyMap = document.createElement('div'); // nie renderujemy, tylko chcemy service
    const service = new g.maps.places.PlacesService(dummyMap);

    service.getDetails(
      {
        placeId,
        sessionToken, // ważne: ta sama sesja co w autocomplete
        fields: ['geometry.location', 'formatted_address'],
      },
      (place, status) => {
        if (status !== g.maps.places.PlacesServiceStatus.OK || !place) {
          return reject(status);
        }
        const loc = place.geometry?.location;
        if (!loc) return reject(new Error('No geometry for place'));
        resolve({
          lat: loc.lat(),
          lng: loc.lng(),
          formattedAddress: place.formatted_address ?? '',
        });
      }
    );
  });
}

export async function reverseGeocodeLatLng(
  lat: number,
  lng: number
): Promise<string> {
  const g = await loadGoogleMaps();

  return new Promise((resolve, reject) => {
    const geocoder = new g.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results || !results[0]) {
        return reject(status);
      }
      resolve(results[0].formatted_address ?? '');
    });
  });
}
