'use client';

import { importPlaces, loadGoogleMaps } from '@/libs/map/googleMaps';
import { useEffect, useRef, useState } from 'react';

/** A single UI-ready suggestion row. */
export type Suggestion = {
  /** Raw Google suggestion object (Places API New). */
  raw: google.maps.places.AutocompleteSuggestion;
  /** Human-readable label rendered in the dropdown. */
  text: string;
};

/** Optional biasing config for the autocomplete request. */
export type Bias = {
  location?: google.maps.LatLngLiteral;
  /** Meters (default ~30km when location provided). */
  radius?: number;
  /** Up to 5 primary types; e.g. ['street_address', 'route', 'locality'] */
  includedPrimaryTypes?: string[];
  /** BCP-47 language code, e.g. 'pl'. */
  language?: string;
  /** Region hint, e.g. 'PL'. */
  region?: string;
};

/**
 * Places (New) Autocomplete hook with:
 * - Debounce (300ms)
 * - Result caching per (query + bias)
 * - Session token reuse per typing session
 * - Race-condition guard (request id)
 */
export function usePlacesAutocomplete(query: string, bias?: Bias) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Session token reused across keystrokes; reset when input is cleared
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null
  );

  // Simple in-memory cache
  const cache = useRef(new Map<string, Suggestion[]>());

  // Request id for race-guarding late responses
  const reqId = useRef(0);

  // Reset session token when user clears the input
  useEffect(() => {
    if (!query.trim()) sessionRef.current = null;
  }, [query]);

  useEffect(() => {
    const q = query.trim();
    let alive = true;
    const id = ++reqId.current;

    if (!q) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    const run = async () => {
      try {
        setLoading(true);

        const g = await loadGoogleMaps();
        const { AutocompleteSuggestion, AutocompleteSessionToken } =
          (await g.maps.importLibrary('places')) as google.maps.PlacesLibrary;

        // Create a token if this is the first keystroke in a new session
        if (!sessionRef.current) {
          sessionRef.current = new AutocompleteSessionToken();
        }

        // Build cache key based on query + bias knobs
        const cacheKey = JSON.stringify({
          q,
          loc: bias?.location ?? null,
          r: bias?.radius ?? null,
          t: (bias?.includedPrimaryTypes || []).slice(0, 5),
          lang: bias?.language ?? null,
          reg: bias?.region ?? null,
        });

        // Serve from cache when possible
        const cached = cache.current.get(cacheKey);
        if (cached) {
          if (!alive || id !== reqId.current) return;
          setSuggestions(cached);
          setLoading(false);
          setError(null);
          return;
        }

        // Build request (Places Autocomplete Data API — New)
        const request: google.maps.places.AutocompleteRequest = {
          input: q,
          sessionToken: sessionRef.current!,
        };

        if (bias?.location) {
          request.locationBias = {
            center: bias.location,
            radius: bias.radius ?? 30_000,
          };
        }
        if (bias?.includedPrimaryTypes?.length) {
          request.includedPrimaryTypes = bias.includedPrimaryTypes.slice(0, 5);
        }
        if (bias?.language) request.language = bias.language;
        if (bias?.region) request.region = bias.region;

        const { suggestions: raw } =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

        const mapped: Suggestion[] = (raw ?? []).map((s) => ({
          raw: s,
          // Per docs: .text is a "LatLngText" with .toString()
          text: s.placePrediction?.text?.toString?.() ?? '',
        }));

        cache.current.set(cacheKey, mapped);
        if (!alive || id !== reqId.current) return;
        setSuggestions(mapped);
        setLoading(false);
        setError(null);
      } catch (e) {
        if (!alive || id !== reqId.current) return;
        setError(e);
        setLoading(false);
      }
    };

    const t = window.setTimeout(run, 300); // debounce
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [
    query,
    bias?.location?.lat,
    bias?.location?.lng,
    bias?.radius,
    // stringifying array keeps a stable dep while avoiding deep compare
    JSON.stringify(bias?.includedPrimaryTypes || []),
    bias?.language,
    bias?.region,
  ]);

  return { suggestions, loading, error, sessionToken: sessionRef.current };
}

/**
 * Hydrates a Place from an AutocompleteSuggestion (Places API, New)
 * and returns a plain object with normalized fields.
 */
export async function fetchPlaceDetailsFromSuggestion(
  suggestion: google.maps.places.AutocompleteSuggestion,
  fields: Array<
    'id' | 'displayName' | 'formattedAddress' | 'location' | 'types'
  > = ['id', 'displayName', 'formattedAddress', 'location']
): Promise<{
  id?: string | undefined;
  displayName?: string | undefined;
  formattedAddress?: string | undefined;
  lat?: number | undefined;
  lng?: number | undefined;
  types?: string[] | undefined;
} | null> {
  // Defensive: placePrediction may be null
  const pred = suggestion?.placePrediction;
  if (!pred) return null;

  await importPlaces();

  // Convert prediction to Place and fetch requested fields
  const place = pred.toPlace() as google.maps.places.Place;
  await place.fetchFields({ fields });

  // Normalize displayName (can be string or {text})
  const displayName =
    typeof place.displayName === 'string'
      ? place.displayName
      : (place.displayName as any)?.text;

  // Normalize location to lat/lng numbers
  const lat = place.location?.lat();
  const lng = place.location?.lng();

  return {
    id: place.id,
    displayName: displayName ?? undefined,
    formattedAddress: place.formattedAddress ?? undefined,
    lat: typeof lat === 'number' ? lat : undefined,
    lng: typeof lng === 'number' ? lng : undefined,
    types: place.types ?? undefined,
  };
}
