'use client';

import { UseFormReturn, Controller } from 'react-hook-form';
import { IntentFormValues } from './useIntentForm';

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
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const { location } = watch();

  const handleUseMyLocation = async () => {
    if (!onUseMyLocation) return;
    const res = await onUseMyLocation();
    if (res) {
      setValue('location.lat', res.lat, { shouldValidate: true });
      setValue('location.lng', res.lng, { shouldValidate: true });
      setValue('location.address', res.address ?? '', { shouldDirty: true });
    }
  };

  return (
    <div className="space-y-4">
      {/* Address input + use my location */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Location (address or POI)
        </label>
        <div className="mt-1 flex gap-2">
          <input
            {...register('location.address')}
            placeholder="Type an address or place…"
            className="w-full rounded-2xl border px-4 py-3
                       border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                       dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
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

      {/* Lat/Lng */}
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
          0 = exact pin; `{'>'}`0 shows a shaded circle on map
          (privacy-friendly).
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
