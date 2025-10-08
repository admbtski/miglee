// hooks/usePlacesAutocomplete.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from './googleMaps';

export type Suggestion = {
  /** surowy obiekt sugestii z API */
  raw: any; // google.maps.places.AutocompleteSuggestion
  /** label do wyświetlenia */
  text: string;
};

export type Bias = {
  location?: google.maps.LatLngLiteral;
  radius?: number; // meters
  includedPrimaryTypes?: string[]; // np. ['street_address','locality'] (max 5)
  language?: string;
  region?: string;
};

export function usePlacesAutocomplete(query: string, bias?: Bias) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null
  );
  const cache = useRef(new Map<string, Suggestion[]>());
  const reqId = useRef(0);

  // gdy input pusty — przygotuj nową sesję do kolejnego wpisywania
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

        // importLibrary zwraca typowany namespace (TS-friendly)
        const { AutocompleteSuggestion, AutocompleteSessionToken } =
          (await g.maps.importLibrary('places')) as google.maps.PlacesLibrary;

        if (!sessionRef.current) {
          sessionRef.current = new AutocompleteSessionToken();
        }

        const cacheKey = JSON.stringify({
          q,
          loc: bias?.location ?? null,
          r: bias?.radius ?? null,
          t: bias?.includedPrimaryTypes ?? null,
          lang: bias?.language ?? null,
          reg: bias?.region ?? null,
        });
        if (cache.current.has(cacheKey)) {
          if (!alive || id !== reqId.current) return;
          setSuggestions(cache.current.get(cacheKey)!);
          setLoading(false);
          setError(null);
          return;
        }

        // Request zgodny z "Place Autocomplete Data API"
        const request: any = {
          input: q,
          sessionToken: sessionRef.current,
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

        const mapped: Suggestion[] = (raw ?? []).map((s: any) => ({
          raw: s,
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

    const t = setTimeout(run, 300); // debounce
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [
    query,
    bias?.location?.lat,
    bias?.location?.lng,
    bias?.radius,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(bias?.includedPrimaryTypes || []),
    bias?.language,
    bias?.region,
  ]);

  return { suggestions, loading, error, sessionToken: sessionRef.current };
}

/** Helper: pobierz szczegóły miejsca (id, nazwę, adres, współrzędne) */
export async function fetchPlaceDetailsFromSuggestion(
  suggestion: any, // google.maps.places.AutocompleteSuggestion
  fields: string[] = ['id', 'displayName', 'formattedAddress', 'location']
) {
  const g = await loadGoogleMaps();
  const { Place } = (await g.maps.importLibrary(
    'places'
  )) as google.maps.PlacesLibrary;

  const place =
    suggestion.placePrediction.toPlace() as google.maps.places.Place;
  await place.fetchFields({ fields: fields as any });
  return place; // ma .id, .displayName, .formattedAddress, .location, ...
}
