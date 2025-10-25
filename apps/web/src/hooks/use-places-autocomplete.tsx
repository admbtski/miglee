// hooks/use-places-autocomplete.ts
'use client';

import { importPlaces, loadGoogleMaps } from '@/lib/map/googleMaps';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from './use-debounced-value';

/** A single UI-ready suggestion row. */
export type Suggestion = {
  raw: google.maps.places.AutocompleteSuggestion;
  text: string;
  placeId?: string;
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

/** Tiny global LRU cache (per app session) to dedupe repeated lookups. */
const LRU_MAX = 64;
const globalCache = new Map<string, Suggestion[]>();
function lruGet(key: string) {
  if (!globalCache.has(key)) return undefined;
  const v = globalCache.get(key)!;
  // bump recency
  globalCache.delete(key);
  globalCache.set(key, v);
  return v;
}
function lruSet(key: string, val: Suggestion[]) {
  globalCache.set(key, val);
  if (globalCache.size > LRU_MAX) {
    const first = globalCache.keys().next().value;
    if (first) globalCache.delete(first);
  }
}

function cacheKeyFor(q: string, bias?: Bias) {
  return JSON.stringify({
    q,
    loc: bias?.location ?? null,
    r: bias?.radius ?? null,
    t: (bias?.includedPrimaryTypes || []).slice(0, 5),
    lang: bias?.language ?? null,
    reg: bias?.region ?? null,
  });
}

/**
 * Places (New) Autocomplete hook with:
 * - Debounce (300ms) via useDebouncedValue
 * - Global LRU cache per (query + bias)
 * - Session token reuse per typing session
 * - Race-condition guard (request id)
 * - Explicit clearSession() for post-select flows
 */
export function usePlacesAutocomplete(query: string, bias?: Bias) {
  const debounced = useDebouncedValue(query.trim(), 300);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null
  );
  const reqId = useRef(0);

  // Reset session token when input empties (ends billing session)
  useEffect(() => {
    if (!debounced) sessionRef.current = null;
  }, [debounced]);

  const key = useMemo(
    () => cacheKeyFor(debounced, bias),
    [
      debounced,
      bias?.location?.lat,
      bias?.location?.lng,
      bias?.radius,
      JSON.stringify(bias?.includedPrimaryTypes || []),
      bias?.language,
      bias?.region,
    ]
  );

  useEffect(() => {
    let alive = true;
    const id = ++reqId.current;

    const q = debounced;
    if (!q) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    const cached = lruGet(key);
    if (cached) {
      if (!alive || id !== reqId.current) return;
      setSuggestions(cached);
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

        if (!sessionRef.current) {
          sessionRef.current = new AutocompleteSessionToken();
        }

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

        const mapped: Suggestion[] = (raw ?? []).map((s) => {
          const pid = s.placePrediction?.placeId;
          const toStr = s.placePrediction?.text?.toString?.() ?? '';
          return { raw: s, text: toStr, placeId: pid };
        });

        lruSet(key, mapped);
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

    run();

    return () => {
      alive = false;
    };
  }, [debounced, key]);

  /** Manually terminates the current Places billing session. Call after the user selects a place. */
  const clearSession = () => {
    sessionRef.current = null;
  };

  return {
    suggestions,
    loading,
    error,
    sessionToken: sessionRef.current,
    clearSession,
  };
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
  placeId?: string;
  id?: string; // alias for compatibility
  displayName?: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  types?: string[];
} | null> {
  const pred = suggestion?.placePrediction;
  if (!pred) return null;

  await importPlaces();

  const place = pred.toPlace() as google.maps.places.Place;

  const ensureFields = Array.from(new Set(['id', ...fields]));
  await place.fetchFields({ fields: ensureFields as any });

  const displayName =
    typeof place.displayName === 'string'
      ? place.displayName
      : (place.displayName as any)?.text;

  const lat = place.location?.lat();
  const lng = place.location?.lng();
  const placeId = place.id || pred.placeId || undefined;

  return {
    placeId,
    id: placeId,
    displayName: displayName ?? undefined,
    formattedAddress: place.formattedAddress ?? undefined,
    lat: typeof lat === 'number' ? lat : undefined,
    lng: typeof lng === 'number' ? lng : undefined,
    types: place.types ?? undefined,
  };
}
