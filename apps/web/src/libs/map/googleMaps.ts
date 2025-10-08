/**
 * Robust Google Maps loader with:
 * - Safe re-entry (multiple calls use one script & promise)
 * - Support for modern `importLibrary` API
 * - Separate cached loaders for "places" and "marker" libraries
 */

let mapsPromise: Promise<typeof google> | null = null;
let placesLibPromise: Promise<google.maps.PlacesLibrary> | null = null;
let markerLibPromise: Promise<google.maps.MarkerLibrary> | null = null;

/**
 * Injects the Google Maps JS script into <head>.
 * Automatically resolves when the global callback fires.
 * If script already exists or Google is loaded, resolves immediately.
 */
function injectMapsScript(
  apiKey: string,
  opts?: { language?: string; region?: string; nonce?: string }
): Promise<typeof google> {
  if ((window as any).google?.maps?.importLibrary) {
    return Promise.resolve((window as any).google);
  }

  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-google-maps-loader="1"]'
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      const interval = window.setInterval(() => {
        if ((window as any).google?.maps?.importLibrary) {
          window.clearInterval(interval);
          resolve((window as any).google);
        }
      }, 30);
      window.setTimeout(() => {
        window.clearInterval(interval);
        reject(new Error('Google Maps failed to load (timeout).'));
      }, 10000);
    });
  }

  return new Promise((resolve, reject) => {
    const cbName = '__init_google_maps_cb__';
    const proxy: any = () => {
      try {
        resolve((window as any).google);
        proxy._resolvers.forEach((fn: any) => fn((window as any).google));
      } catch (err) {
        reject(err);
        proxy._rejecters.forEach((fn: any) => fn(err));
      } finally {
        delete (window as any)[cbName];
      }
    };
    proxy._resolvers = [] as Array<(g: typeof google) => void>;
    proxy._rejecters = [] as Array<(e: unknown) => void>;
    (window as any)[cbName] = proxy;

    const params = new URLSearchParams({
      key: apiKey,
      v: 'weekly',
      callback: cbName,
      ...(opts?.language ? { language: opts.language } : {}),
      ...(opts?.region ? { region: opts.region } : {}),
    });

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps-loader', '1');
    if (opts?.nonce) script.nonce = opts.nonce;
    script.onerror = () => reject(new Error('Failed to load Google Maps JS.'));
    document.head.appendChild(script);
  });
}

/**
 * Main loader — returns a single shared Promise.
 * Use this in all components that rely on `google.maps`.
 */
export async function loadGoogleMaps(opts?: {
  language?: string;
  region?: string;
  nonce?: string;
}): Promise<typeof google> {
  if (mapsPromise) return mapsPromise;
  if (typeof window === 'undefined') {
    throw new Error('Google Maps must be loaded in the browser.');
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');

  mapsPromise = (async () => {
    const g = await injectMapsScript(apiKey, {
      language: opts?.language ?? 'pl',
      region: opts?.region ?? 'PL',
      nonce: opts?.nonce ?? '',
    });
    return g;
  })();

  return mapsPromise;
}

/**
 * Loads and caches the modern "places" library.
 */
export async function importPlaces() {
  if (placesLibPromise) return placesLibPromise;
  const g = await loadGoogleMaps();
  placesLibPromise = g.maps.importLibrary(
    'places'
  ) as Promise<google.maps.PlacesLibrary>;
  return placesLibPromise;
}

/**
 * Loads and caches the "marker" library for AdvancedMarkerElement.
 */
export async function importMarker() {
  if (markerLibPromise) return markerLibPromise;
  const g = await loadGoogleMaps();
  markerLibPromise = g.maps.importLibrary(
    'marker'
  ) as Promise<google.maps.MarkerLibrary>;
  return markerLibPromise;
}
