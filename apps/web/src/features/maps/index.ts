/**
 * Maps Feature
 *
 * Exports all maps-related functionality:
 * - API hooks for map clusters
 * - Components for map display
 * - Hooks for places autocomplete
 * - Utils for geocoding and Google Maps
 */

// API
export * from './api';

// Components
export { MapPreview } from './components/map-preview';

// Hooks
export { 
  fetchPlaceDetailsFromSuggestion,
  usePlacesAutocomplete,
  type Suggestion,
  type Bias,
} from './hooks/use-places-autocomplete';

// Utils
export {
  extractCityFromPlace,
  resolveCityInfo,
  resolveCityPlaceId,
  type CityInfo,
} from './utils/city-helpers';
export { reverseGeocode, reverseGeocodeLatLng } from './utils/geocode';
export { importMarker, importPlaces, loadGoogleMaps } from './utils/googleMaps';
export { getPlaceDetailsById } from './utils/places';
