// app/(wherever)/PlaceStep.tsx
'use client';

import { MapPreview } from '@/components/map/map-preview';
import { reverseGeocode, reverseGeocodeLatLng } from '@/libs/map/geocode';
import {
  Eye,
  EyeOff,
  Globe2,
  Info,
  Link as LinkIcon,
  MapPin,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import { LocationCombo } from '../combobox/location-combobox';
import { SegmentedControl } from '../segment-control/segment-control';
import { RadiusSlider } from './slider';
import { IntentFormValues } from './types';

type MK = 'ONSITE' | 'ONLINE' | 'HYBRID';
type Visibility = 'PUBLIC' | 'HIDDEN';

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
    control,
    formState: { errors },
  } = form;

  // reactive slices
  const meetingKind = useWatch({ control, name: 'meetingKind' }) as MK;
  const onlineUrl = useWatch({ control, name: 'onlineUrl' }) ?? '';
  const loc = watch('location');

  const [locating, setLocating] = useState(false);

  const center = useMemo(() => {
    const lat = typeof loc?.lat === 'number' ? +loc.lat : undefined;
    const lng = typeof loc?.lng === 'number' ? +loc.lng : undefined;
    return typeof lat === 'number' && typeof lng === 'number'
      ? ({ lat, lng } as const)
      : null;
  }, [loc?.lat, loc?.lng]);

  const radiusMeters: number | null = useMemo(() => {
    const r = loc?.radiusKm;
    return typeof r === 'number' && r > 0 ? r * 1000 : null;
  }, [loc?.radiusKm]);

  const showOnsite = meetingKind === 'ONSITE' || meetingKind === 'HYBRID';
  const showOnline = meetingKind === 'ONLINE' || meetingKind === 'HYBRID';

  const handleUseMyLocation = useCallback(async () => {
    try {
      setLocating(true);

      if (onUseMyLocation) {
        const res = await onUseMyLocation();
        if (res) {
          setValue('location.lat', res.lat, {
            shouldValidate: true,
            shouldDirty: true,
          });
          setValue('location.lng', res.lng, {
            shouldValidate: true,
            shouldDirty: true,
          });
          const nice =
            res.address ?? (await reverseGeocodeLatLng(res.lat, res.lng));
          if (nice) setValue('location.address', nice, { shouldDirty: true });
          return;
        }
      }

      // fallback: browser geolocation
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
      setValue('location.lat', lat, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('location.lng', lng, {
        shouldValidate: true,
        shouldDirty: true,
      });

      const nice = await reverseGeocodeLatLng(lat, lng);
      if (nice) setValue('location.address', nice, { shouldDirty: true });
    } catch (e) {
      console.error('Use my location failed:', e);
    } finally {
      setLocating(false);
    }
  }, [onUseMyLocation, setValue]);

  return (
    <div className="space-y-8">
      {/* Meeting type */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Meeting type
        </label>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Wybierz formę spotkania. Dla <b>Online</b> dodaj link; dla{' '}
          <b>On-site</b> ustaw pinezkę.
          <b> Hybrid</b> łączy obie opcje.
        </p>

        <Controller
          control={control}
          name="meetingKind"
          render={({ field }) => (
            <SegmentedControl<MK>
              aria-label="Meeting type"
              value={field.value}
              size="md"
              fullWidth
              withPill
              animated
              onChange={(v) => field.onChange(v)}
              options={[
                { value: 'ONSITE', label: 'On-site', Icon: MapPin },
                { value: 'ONLINE', label: 'Online', Icon: LinkIcon },
                { value: 'HYBRID', label: 'Hybrid', Icon: Globe2 },
              ]}
            />
          )}
        />
      </div>

      {/* Online link */}
      {showOnline && (
        <div>
          <label
            htmlFor="onlineUrl"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Online meeting link
          </label>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Akceptujemy <b>http/https</b>. Przykłady: Zoom, Google Meet, Teams,
            Discord.
          </p>

          <input
            id="onlineUrl"
            type="url"
            inputMode="url"
            placeholder="https://…"
            {...register('onlineUrl')}
            aria-invalid={!!errors.onlineUrl}
            aria-describedby={errors.onlineUrl ? 'onlineUrl-err' : undefined}
            className={[
              'w-full rounded-2xl border px-4 py-3 text-zinc-900 shadow-inner focus:outline-none focus:ring-2',
              errors.onlineUrl
                ? 'border-red-500/70 focus:ring-red-500/40 focus:border-red-500'
                : 'border-zinc-300 focus:border-zinc-400 focus:ring-indigo-500/40',
              'bg-white placeholder:text-zinc-400',
              'dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500',
            ].join(' ')}
          />
          <div id="onlineUrl-err" className="mt-1 text-xs text-red-500">
            {errors.onlineUrl?.message as string}
          </div>
        </div>
      )}

      {/* On-site / Hybrid */}
      {showOnsite && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Location (address or POI)
            </label>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Zacznij wpisywać adres lub nazwę miejsca — albo użyj „Use my
              location”.
            </p>

            <div className="flex gap-2">
              <div className="w-full">
                <LocationCombo
                  loadingOverride={locating}
                  value={loc?.address ?? ''}
                  onChangeText={(txt) =>
                    setValue('location.address', txt, { shouldDirty: true })
                  }
                  onPickPlace={({
                    address,
                    lat,
                    lng,
                    displayName,
                    placeId,
                  }) => {
                    const addr = address ?? displayName ?? '';
                    setValue('location.address', addr, { shouldDirty: true });

                    if (typeof placeId === 'string') {
                      setValue('location.placeId', placeId, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }

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
                disabled={locating}
                className="shrink-0 rounded-2xl border px-4 py-3
                           border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50
                           disabled:cursor-not-allowed disabled:opacity-60
                           dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                {locating ? 'Locating…' : 'Use my location'}
              </button>
            </div>

            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {meetingKind === 'ONSITE'
                ? 'W trybie on-site wymagamy współrzędnych (adres opcjonalny).'
                : 'W trybie hybrid możesz dodać zarówno link, jak i lokalizację.'}
            </div>
            <div className="mt-1 text-xs text-red-500" aria-live="polite">
              {meetingKind === 'ONSITE' &&
                errors.location &&
                'Location is required for on-site meetings'}
              {meetingKind === 'HYBRID' &&
                (errors.meetingKind?.message as string)}
            </div>
          </div>

          {/* Map preview */}
          <div className="mt-2">
            <MapPreview
              center={center}
              zoom={center ? 15 : 6}
              radiusMeters={radiusMeters}
              draggableMarker
              clickToPlace
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800"
              onUserSetPosition={(pos) => {
                setValue('location.placeId', pos.placeId, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setValue('location.lat', pos.lat, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setValue('location.lng', pos.lng, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                void reverseGeocode(pos)
                  .then((rg) => {
                    const addr = rg.formattedAddress ?? '';
                    setValue('location.address', addr, { shouldDirty: true });
                  })
                  .catch(() => {});
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Radius (km, optional)
            </label>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Ustaw promień prywatności wokół pinezki. <b>0</b> = dokładny
              punkt.
            </p>

            {/* szybkie presety */}
            <div className="mb-2 flex flex-wrap gap-2">
              {([0, 0.5, 1, 2, 5, 10] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    setValue('location.radiusKm', r, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className="rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
                >
                  {r} km
                </button>
              ))}
            </div>

            <RadiusSlider
              value={typeof loc?.radiusKm === 'number' ? loc.radiusKm : 0}
              min={0}
              max={20}
              onUpdate={(v) => {
                // live UI / map refresh (opcjonalnie)
                setValue('location.radiusKm', v, { shouldDirty: true });
              }}
              onChange={(v) => {
                console.log('test2');
                setValue('location.radiusKm', v, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              className="mt-1"
              aria-describedby="radius-hint"
            />

            <div
              id="radius-hint"
              className="mt-1 text-xs text-zinc-500 dark:text-zinc-400"
            >
              Zwiększ wartość, aby wyświetlić zacienione koło wokół miejsca
              (lepsza prywatność).
            </div>
          </div>
        </>
      )}

      {/* Visibility -> SegmentedControl */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Visibility
        </label>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          <b>Public</b> — każdy może znaleźć. <b>Hidden</b> — tylko z linku lub
          zaproszenia.
        </p>

        <Controller
          control={control}
          name="visibility"
          render={({ field }) => (
            <SegmentedControl<Visibility>
              aria-label="Visibility"
              value={field.value}
              size="md"
              fullWidth
              withPill
              animated
              onChange={(v) => field.onChange(v)}
              options={[
                { value: 'PUBLIC', label: 'Public', Icon: Eye },
                { value: 'HIDDEN', label: 'Hidden', Icon: EyeOff },
              ]}
            />
          )}
        />
      </div>

      {/* Logistics note */}
      <div>
        <label
          htmlFor="notes"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Logistics note (optional)
        </label>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Krótka informacja ułatwiająca dotarcie lub dołączenie (np. punkt
          zbiórki, zasady).
        </p>

        <input
          id="notes"
          {...register('notes')}
          placeholder={
            meetingKind === 'ONLINE'
              ? 'e.g., “Camera optional.”'
              : 'We meet at entrance A'
          }
          className="w-full rounded-2xl border px-4 py-3
                     border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                     dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      {/* Info note */}
      <div
        role="note"
        className="flex items-start gap-2 rounded-2xl border border-blue-300/50 bg-blue-50 p-3
                   text-blue-700 dark:border-blue-400/30 dark:bg-blue-900/20 dark:text-blue-200"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full
                     bg-blue-100/70 text-blue-700 ring-1 ring-blue-300/60
                     dark:bg-blue-400/10 dark:text-blue-200 dark:ring-blue-400/30"
        >
          <Info className="h-3.5 w-3.5" />
        </span>
        <p className="text-sm leading-5">
          Dla prywatnych miejsc rozważ ustawienie <b>Hidden</b> oraz{' '}
          <b>Radius</b> &gt; 0, aby maskować dokładny adres na mapie.
        </p>
      </div>
    </div>
  );
}
