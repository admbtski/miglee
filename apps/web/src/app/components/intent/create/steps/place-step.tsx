'use client';

import { UseFormReturn } from 'react-hook-form';
import { IntentFormValues } from '../../types';
import {
  LocationCombo,
  LocationComboValue,
} from '../components/location-combobox';
import { reverseGeocodeLatLng } from '@/libs/map/places';
import { MapPreview } from '@/app/components/location/MapPreview';
import { reverseGeocode } from '@/libs/map/geocode';

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

  const location = watch('location'); // { address?: string, lat?: number, lng?: number, radiusKm?: number }
  const addr = watch('location.address') ?? '';
  const currentValue: LocationComboValue | null =
    location?.lat != null && location?.lng != null
      ? {
          lat: location.lat!,
          lng: location.lng!,
          address: location.address ?? '',
        }
      : null;

  const center =
    location?.lat != null && location?.lng != null
      ? { lat: Number(location.lat), lng: Number(location.lng) }
      : null;

  const handleComboChange = (v: LocationComboValue | null) => {
    if (v == null) {
      setValue('location.address', '', { shouldDirty: true });
      setValue('location.lat', undefined as any, { shouldValidate: true });
      setValue('location.lng', undefined as any, { shouldValidate: true });
      return;
    }
    setValue('location.address', v.address ?? '', { shouldDirty: true });
    setValue('location.lat', v.lat, { shouldValidate: true });
    setValue('location.lng', v.lng, { shouldValidate: true });
  };

  const handleUseMyLocation = async () => {
    try {
      if (onUseMyLocation) {
        const res = await onUseMyLocation();
        if (res) {
          setValue('location.lat', res.lat, { shouldValidate: true });
          setValue('location.lng', res.lng, { shouldValidate: true });
          setValue('location.address', res.address ?? '', {
            shouldDirty: true,
          });
          return;
        }
      }

      // domyślna implementacja: geolocation + reverse geocoding
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation)
          return reject(new Error('Geolocation not supported'));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      let addr = '';
      try {
        addr = await reverseGeocodeLatLng(lat, lng);
      } catch {
        // ignore reverse geocode errors
      }

      setValue('location.lat', lat, { shouldValidate: true });
      setValue('location.lng', lng, { shouldValidate: true });
      setValue('location.address', addr, { shouldDirty: true });
    } catch (e) {
      console.error('Use my location failed:', e);
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
              value={location?.address ?? ''}
              onChangeText={(txt) =>
                setValue('location.address', txt, { shouldDirty: true })
              }
              onPickPlace={(p) => {
                if (p.address)
                  setValue('location.address', p.address, {
                    shouldDirty: true,
                  });
                if (typeof p.lat === 'number')
                  setValue('location.lat', p.lat, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                if (typeof p.lng === 'number')
                  setValue('location.lng', p.lng, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
              }}
              bias={{
                location: { lat: 52.2297, lng: 21.0122 },
                radius: 50_000,
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="shrink-0 rounded-2xl border px-4 py-3
                       border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50
                       dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Use my location
          </button>
        </div>
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Lat/Lng required — address is optional.
        </div>
      </div>

      <div className="mt-2">
        <MapPreview
          center={center}
          zoom={center ? 15 : 6}
          radiusMeters={
            typeof location?.radiusKm === 'number' && location.radiusKm > 0
              ? location.radiusKm * 1000
              : undefined
          }
          draggableMarker
          clickToPlace
          onUserSetPosition={async (pos) => {
            // 1) ustaw współrzędne w formularzu
            setValue('location.lat', pos.lat, {
              shouldValidate: true,
              shouldDirty: true,
            });
            setValue('location.lng', pos.lng, {
              shouldValidate: true,
              shouldDirty: true,
            });

            // 2) reverse geocode → uzupełnij adres (LocationCombo)
            const rg = await reverseGeocode(pos);
            if (rg.formattedAddress) {
              setValue('location.address', rg.formattedAddress, {
                shouldDirty: true,
              });
            }
          }}
          className="w-full border border-zinc-200 dark:border-zinc-800"
          // mapId="YOUR_VECTOR_MAP_ID" // (zalecane dla AdvancedMarker)
        />
      </div>

      {/* Lat/Lng manual (fallback / inspection) */}
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
          0 = exact pin; &gt;0 shows a shaded circle on map (privacy-friendly).
        </div>
      </div>

      {/* Notes */}
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
