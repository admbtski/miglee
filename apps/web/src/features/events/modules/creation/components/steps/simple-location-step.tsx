'use client';

// TODO i18n: Polish strings need translation

import { useCallback, useMemo, useState } from 'react';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import { Globe2, Info, Link as LinkIcon, MapPin } from 'lucide-react';

import { LocationCombo } from '@/components/forms/location-combobox';
import { SegmentedControl } from '@/components/ui/segment-control';
import { MapPreview } from '@/features/maps';
import {
  reverseGeocode,
  reverseGeocodeLatLng,
} from '@/features/maps';
import type { SimpleEventFormValues } from '@/features/events/modules/creation/types/event-form';

type MK = 'ONSITE' | 'ONLINE' | 'HYBRID';

/**
 * SimpleLocationStep - Simplified location step with LocationCombo
 *
 * Features:
 * - Meeting kind selection (Onsite, Online, Hybrid)
 * - Google Places autocomplete via LocationCombo
 * - Small map preview for visual confirmation
 * - Optional online link
 */
export function SimpleLocationStep({
  form,
}: {
  form: UseFormReturn<SimpleEventFormValues>;
}) {
  const {
    setValue,
    watch,
    control,
    formState: { errors },
  } = form;

  const meetingKind = useWatch({ control, name: 'meetingKind' }) as MK;
  const loc = watch('location');

  const [locating, setLocating] = useState(false);

  const center = useMemo(() => {
    const lat = typeof loc?.lat === 'number' ? +loc.lat : undefined;
    const lng = typeof loc?.lng === 'number' ? +loc.lng : undefined;
    return typeof lat === 'number' && typeof lng === 'number'
      ? ({ lat, lng } as const)
      : null;
  }, [loc?.lat, loc?.lng]);

  const showOnsite = meetingKind === 'ONSITE' || meetingKind === 'HYBRID';
  const showOnline = meetingKind === 'ONLINE' || meetingKind === 'HYBRID';

  const handleUseMyLocation = useCallback(async () => {
    try {
      setLocating(true);

      if (!navigator.geolocation) throw new Error('Geolocation not supported');

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
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

      const nice = await reverseGeocodeLatLng(lat, lng).catch(() => undefined);
      if (nice) setValue('location.address', nice, { shouldDirty: true });
    } catch (e) {
      console.error('Use my location failed:', e);
    } finally {
      setLocating(false);
    }
  }, [setValue]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Gdzie się spotykamy?
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Wybierz format wydarzenia i podaj lokalizację.
        </p>
      </div>

      {/* Meeting type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Typ spotkania <span className="text-red-500">*</span>
        </label>
        <Controller
          control={control}
          name="meetingKind"
          render={({ field }) => (
            <SegmentedControl<MK>
              aria-label="Typ spotkania"
              value={field.value}
              size="md"
              fullWidth
              withPill
              animated
              onChange={(v) => field.onChange(v)}
              options={[
                { value: 'ONSITE', label: 'Stacjonarne', Icon: MapPin },
                { value: 'ONLINE', label: 'Online', Icon: LinkIcon },
                { value: 'HYBRID', label: 'Hybrydowe', Icon: Globe2 },
              ]}
            />
          )}
        />
      </div>

      {/* Location input for onsite/hybrid */}
      {showOnsite && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Lokalizacja <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Wpisz adres lub nazwę miejsca — lub użyj swojej lokalizacji.
            </p>

            <div className="flex gap-2">
              <div className="flex-1">
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
                    cityName,
                    cityPlaceId,
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
                    if (typeof cityName === 'string') {
                      setValue('location.cityName', cityName, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                    if (typeof cityPlaceId === 'string') {
                      setValue('location.cityPlaceId', cityPlaceId, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                  bias={{
                    location: { lat: 52.2297, lng: 21.0122 },
                    radius: 50_000,
                  }}
                  placeholder="Wpisz adres lub miejsce…"
                />
              </div>

              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                className="px-4 py-3 bg-white border shrink-0 rounded-2xl border-zinc-300 text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-900 transition-all shadow-sm font-medium text-sm"
              >
                {locating ? '🔍 Szukam…' : '📍 Moja lokalizacja'}
              </button>
            </div>

            {errors.location && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Lokalizacja jest wymagana dla spotkań stacjonarnych
              </p>
            )}
          </div>

          {/* Small map preview */}
          <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
            <MapPreview
              center={center}
              zoom={center ? 14 : 5}
              draggableMarker
              clickToPlace
              className="w-full h-[180px]"
              onUserSetPosition={(pos) => {
                setValue('location.lat', pos.lat, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setValue('location.lng', pos.lng, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                reverseGeocode(pos)
                  .then((rg) => {
                    const addr = rg.formattedAddress ?? '';
                    setValue('location.address', addr, { shouldDirty: true });

                    if (rg.placeId) {
                      setValue('location.placeId', rg.placeId, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  })
                  .catch(() => {});
              }}
            />
          </div>
        </div>
      )}

      {/* Online link for online/hybrid */}
      {showOnline && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Link do spotkania{' '}
            {meetingKind === 'ONLINE' ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="text-zinc-400">(opcjonalnie)</span>
            )}
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Zoom, Google Meet, Teams, Discord lub inny link.
          </p>
          <Controller
            name="onlineUrl"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                value={field.value || ''}
                type="url"
                inputMode="url"
                placeholder="https://..."
                className={[
                  'w-full rounded-xl border px-4 py-3 text-base transition-all focus:outline-none focus:ring-2',
                  errors.onlineUrl
                    ? 'border-red-500/70 focus:ring-red-500/40 focus:border-red-500'
                    : 'border-zinc-300 focus:border-indigo-400 focus:ring-indigo-500/40',
                  'bg-white text-zinc-900 placeholder:text-zinc-400',
                  'dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:border-zinc-700 dark:focus:border-indigo-600',
                ].join(' ')}
              />
            )}
          />
          {errors.onlineUrl && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.onlineUrl.message as string}
            </p>
          )}
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 dark:text-indigo-100">
          {showOnsite ? (
            <>
              Dokładne miejsce możesz ustawić na mapie klikając lub przeciągając
              marker. Promień prywatności ustawisz później w panelu wydarzenia.
            </>
          ) : (
            <>
              Link do spotkania możesz również dodać lub zmienić później w
              panelu wydarzenia.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
