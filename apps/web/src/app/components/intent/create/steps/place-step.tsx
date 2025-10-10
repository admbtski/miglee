// app/(wherever)/PlaceStep.tsx
'use client';

import { useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { IntentFormValues } from '../../types';
import { MapPreview } from '@/app/components/location/map-preview';
import { reverseGeocode, reverseGeocodeLatLng } from '@/libs/map/geocode';
import { LocationCombo } from '../components/location-combobox';

export function PlaceStep({
  form,
  onUseMyLocation,
}: {
  form: UseFormReturn<IntentFormValues>;
  onUseMyLocation?: () => Promise<{
    lat: number;
    lng: number;
    address?: string;
  } | null>;
}) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const [locating, setLocating] = useState(false);
  const loc = watch('location');
  const [geoBusy, setGeoBusy] = useState(false);

  const center = useMemo(
    () =>
      typeof loc?.lat === 'number' && typeof loc?.lng === 'number'
        ? ({ lat: +loc.lat, lng: +loc.lng } as const)
        : null,
    [loc?.lat, loc?.lng]
  );

  // IMPORTANT: MapPreview expects number | null (not undefined) with exactOptionalPropertyTypes
  const radiusMeters: number | null = useMemo(() => {
    return typeof loc?.radiusKm === 'number' && loc.radiusKm > 0
      ? loc.radiusKm * 1000
      : null;
  }, [loc?.radiusKm]);

  const commitPlace = (payload: {
    address?: string;
    lat?: number;
    lng?: number;
    displayName?: string;
    id?: string;
  }) => {
    if (typeof payload.lat === 'number') {
      setValue('location.lat', payload.lat, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (typeof payload.lng === 'number') {
      setValue('location.lng', payload.lng, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    const addr = payload.address ?? payload.displayName ?? '';
    setValue('location.address', addr, { shouldDirty: true });
  };

  const handleUseMyLocation = async () => {
    try {
      setLocating(true);

      // 1) Jeśli masz własny provider, użyj go
      if (onUseMyLocation) {
        const res = await onUseMyLocation();
        if (res) {
          setValue('location.lat', res.lat, { shouldValidate: true });
          setValue('location.lng', res.lng, { shouldValidate: true });

          // reverse geocode -> ustaw nazwę TYLKO jeśli ją mamy
          const nice =
            res.address ?? (await reverseGeocodeLatLng(res.lat, res.lng));
          if (nice) {
            setValue('location.address', nice, { shouldDirty: true });
          }
          return;
        }
      }

      // 2) Standardowa geolokalizacja
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation)
          return reject(new Error('Geolocation not supported'));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 30000,
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // Najpierw ustaw współrzędne (mapa/marker zareaguje od razu)
      setValue('location.lat', lat, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('location.lng', lng, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Potem spróbuj uzyskać nazwę; NIE wpisuj koordynatów jako tekstu
      const addr = await reverseGeocodeLatLng(lat, lng);
      if (addr) {
        setValue('location.address', addr, { shouldDirty: true });
      }
    } catch (e) {
      console.error('Use my location failed:', e);
      // nic nie wpisujemy do address — zostawiamy poprzednią wartość
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Address / Place Autocomplete */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Location (address or POI)
        </label>
        <div className="mt-1 flex gap-2">
          <div className="w-full">
            <LocationCombo
              loadingOverride={locating}
              value={loc?.address ?? ''}
              onChangeText={(txt) =>
                setValue('location.address', txt, { shouldDirty: true })
              }
              onPickPlace={({ address, lat, lng, displayName }) => {
                const addr = address ?? displayName ?? '';
                setValue('location.address', addr, { shouldDirty: true });
                if (typeof lat === 'number') {
                  setValue('location.lat', lat, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
                if (typeof lng === 'number') {
                  setValue('location.lng', lng, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
              bias={{
                location: { lat: 52.2297, lng: 21.0122 },
                radius: 50_000,
              }}
              placeholder="Type an address or place…"
            />
          </div>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={geoBusy}
            className="shrink-0 rounded-2xl border px-4 py-3
                       border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50
                       disabled:opacity-60 disabled:cursor-not-allowed
                       dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            {geoBusy ? 'Locating…' : 'Use my location'}
          </button>
        </div>
      </div>

      {/* Map (two-way binding) */}
      <div className="mt-2">
        <MapPreview
          center={center}
          zoom={center ? 15 : 6}
          radiusMeters={radiusMeters}
          draggableMarker
          clickToPlace
          className="w-full border border-zinc-200 dark:border-zinc-800"
          // mapId="YOUR_VECTOR_MAP_ID"
          onUserSetPosition={(pos) => {
            // 1) commit coordinates to the form
            setValue('location.lat', pos.lat, {
              shouldValidate: true,
              shouldDirty: true,
            });
            setValue('location.lng', pos.lng, {
              shouldValidate: true,
              shouldDirty: true,
            });

            // 2) reverse geocode → update address (do not return a Promise from handler)
            void reverseGeocode(pos)
              .then((rg) => {
                const addr = rg.formattedAddress ?? '';
                setValue('location.address', addr, { shouldDirty: true });
              })
              .catch(() => {
                // ignore reverse geocode errors
              });
          }}
        />
      </div>

      {/* Manual latitude/longitude */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            {...register('location.lat', { valueAsNumber: true })}
            className="mt-1 w-full rounded-2xl border px-4 py-3
                       border-zinc-300 bg-white text-zinc-900
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                       dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
          />
          <div className="mt-1 text-xs text-red-500">
            {errors.location?.lat && 'Latitude is required'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            {...register('location.lng', { valueAsNumber: true })}
            className="mt-1 w-full rounded-2xl border px-4 py-3
                       border-zinc-300 bg-white text-zinc-900
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                       dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
          />
          <div className="mt-1 text-xs text-red-500">
            {errors.location?.lng && 'Longitude is required'}
          </div>
        </div>
      </div>

      {/* Radius */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Radius (km, optional)
        </label>
        <input
          type="number"
          step="0.1"
          min={0}
          max={20}
          {...register('location.radiusKm', { valueAsNumber: true })}
          className="mt-1 w-full rounded-2xl border px-4 py-3
                     border-zinc-300 bg-white text-zinc-900
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                     dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
        />
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          0 = exact pin; &gt; 0 shows a shaded circle on the map
          (privacy-friendly).
        </div>
      </div>

      {/* Logistics note */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Logistics note (optional)
        </label>
        <input
          {...register('notes')}
          placeholder="We meet at entrance A"
          className="mt-1 w-full rounded-2xl border px-4 py-3
                     border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                     dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Visibility
        </label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <label
            className="flex cursor-pointer items-center gap-2 rounded-2xl border p-3
                             border-zinc-300 bg-white hover:bg-zinc-50
                             dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
          >
            <input type="radio" value="PUBLIC" {...register('visibility')} />
            Public
          </label>
          <label
            className="flex cursor-pointer items-center gap-2 rounded-2xl border p-3
                             border-zinc-300 bg-white hover:bg-zinc-50
                             dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
          >
            <input type="radio" value="HIDDEN" {...register('visibility')} />
            Hidden (link or invite)
          </label>
        </div>
      </div>
    </div>
  );
}
