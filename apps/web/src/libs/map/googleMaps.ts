// lib/googleMaps.ts
let mapsPromise: Promise<typeof google> | null = null;

function injectMapsScript(
  apiKey: string,
  opts?: { language?: string; region?: string }
) {
  return new Promise<typeof google>((resolve, reject) => {
    // jeśli już ktoś załadował
    if ((window as any).google?.maps?.importLibrary) {
      resolve((window as any).google);
      return;
    }

    const cb = '__init_google_maps_cb__';
    (window as any)[cb] = () => {
      try {
        resolve((window as any).google);
      } catch (e) {
        reject(e);
      } finally {
        try {
          delete (window as any)[cb];
        } catch {}
      }
    };

    const params = new URLSearchParams({
      key: apiKey,
      v: 'weekly',
      callback: cb,
      ...(opts?.language ? { language: opts.language } : {}),
      ...(opts?.region ? { region: opts.region } : {}),
    });

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/** Ładuje Maps JS i bibliotekę "places" (NEW). */
export async function loadGoogleMaps(): Promise<typeof google> {
  if (mapsPromise) return mapsPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');

  mapsPromise = (async () => {
    const g = await injectMapsScript(apiKey, { language: 'pl', region: 'PL' });
    await g.maps.importLibrary('places'); // nowy sposób
    return g;
  })();

  return mapsPromise;
}
