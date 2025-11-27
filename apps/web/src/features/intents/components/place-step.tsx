// app/(wherever)/PlaceStep.tsx
'use client';

import { MapPreview } from '@/features/maps/components/map-preview';
import {
  reverseGeocode,
  reverseGeocodeLatLng,
} from '@/features/maps/utils/geocode';
import { Globe2, Info, Link as LinkIcon, MapPin } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import { LocationCombo } from '@/components/forms/location-combobox';
import { SegmentedControl } from '@/components/ui/segment-control';
import { RadiusSlider } from './slider';
import { IntentFormValues } from './types';

type MK = 'ONSITE' | 'ONLINE' | 'HYBRID';

function FormSection({
  title,
  description,
  children,
  error,
  hint,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </label>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
      {children}
      {hint && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <span className="text-base">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

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
            res.address ??
            (await reverseGeocodeLatLng(res.lat, res.lng).catch(
              () => undefined
            ));
          if (nice) setValue('location.address', nice, { shouldDirty: true });
          return;
        }
      }

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
      // soft-fail only
      console.error('Use my location failed:', e);
    } finally {
      setLocating(false);
    }
  }, [onUseMyLocation, setValue]);

  return (
    <div className="space-y-8">
      {/* Meeting type */}
      <FormSection
        title="Typ spotkania"
        description="Wybierz format. Dla opcji Online dodaj link; dla Stacjonarne ustaw pin na mapie. Hybrydowe łączy oba."
      >
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
      </FormSection>

      {/* Online link */}
      {showOnline && (
        <FormSection
          title="Link do spotkania online"
          description="Akceptujemy linki http/https (Zoom, Meet, Teams, Discord)."
          error={errors.onlineUrl?.message as string}
        >
          <Controller
            name="onlineUrl"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                value={field.value || ''}
                id="onlineUrl"
                type="url"
                inputMode="url"
                placeholder="https://…"
                aria-invalid={!!errors.onlineUrl}
                aria-describedby={
                  errors.onlineUrl ? 'onlineUrl-err' : undefined
                }
                className={[
                  'w-full rounded-2xl border px-4 py-3.5 text-zinc-900 shadow-sm transition-all focus:outline-none focus:ring-2',
                  errors.onlineUrl
                    ? 'border-red-500/70 focus:ring-red-500/40 focus:border-red-500'
                    : 'border-zinc-300 focus:border-indigo-400 focus:ring-indigo-500/40',
                  'bg-white placeholder:text-zinc-400',
                  'dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500',
                ].join(' ')}
              />
            )}
          />
        </FormSection>
      )}

      {/* On-site / Hybrid */}
      {showOnsite && (
        <>
          <FormSection
            title="Lokalizacja (adres lub miejsce)"
            description="Zacznij pisać adres lub nazwę miejsca — lub użyj przycisku 'Użyj mojej lokalizacji'."
            hint={
              meetingKind === 'ONSITE'
                ? 'Spotkanie stacjonarne wymaga współrzędnych (adres opcjonalny).'
                : 'Wydarzenie hybrydowe może zawierać zarówno link, jak i lokalizację.'
            }
            error={
              meetingKind === 'ONSITE' && errors.location
                ? 'Lokalizacja jest wymagana dla spotkań stacjonarnych'
                : meetingKind === 'HYBRID'
                  ? (errors.meetingKind?.message as string)
                  : undefined
            }
          >
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
                className="px-4 py-3.5 bg-white border shrink-0 rounded-2xl border-zinc-300 text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-900 transition-all shadow-sm font-medium text-sm"
              >
                {locating ? '🔍 Szukam…' : '📍 Użyj mojej lokalizacji'}
              </button>
            </div>
          </FormSection>

          {/* Map Preview */}
          <div className="relative">
            <div className="overflow-hidden bg-white border shadow-lg rounded-2xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
              <MapPreview
                center={center}
                zoom={center ? 15 : 6}
                radiusMeters={radiusMeters}
                draggableMarker
                clickToPlace
                className="w-full h-[420px]"
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
                  reverseGeocode(pos)
                    .then((rg) => {
                      const addr = rg.formattedAddress ?? '';
                      setValue('location.address', addr, { shouldDirty: true });
                    })
                    .catch(() => {});
                }}
              />
            </div>
          </div>

          <FormSection
            title="Promień prywatności (km, opcjonalnie)"
            description="Ustaw promień prywatności wokół pinu. 0 = dokładny punkt."
            hint="Zwiększ aby wyświetlić zaciemniony okrąg wokół lokalizacji (lepsza prywatność)."
          >
            {/* quick presets */}
            <div className="flex flex-wrap gap-2">
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
                  className={[
                    'rounded-xl border px-3 py-2 text-sm font-medium transition-all',
                    typeof loc?.radiusKm === 'number' && loc.radiusKm === r
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-800'
                      : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 dark:text-zinc-300',
                  ].join(' ')}
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
                setValue('location.radiusKm', v, { shouldDirty: true });
              }}
              onChange={(v) => {
                setValue('location.radiusKm', v, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              className="mt-4"
              aria-describedby="radius-hint"
            />
          </FormSection>
        </>
      )}

      {/* Logistics note */}
      <FormSection
        title="Notatka logistyczna (opcjonalnie)"
        description="Krótka wskazówka, która pomoże ludziom dotrzeć na miejsce lub dołączyć."
      >
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              value={field.value || ''}
              id="notes"
              placeholder={
                meetingKind === 'ONLINE'
                  ? 'np. "Kamera opcjonalna."'
                  : 'np. "Spotykamy się przy wejściu A"'
              }
              className="w-full px-4 py-3.5 bg-white border rounded-2xl border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 transition-all shadow-sm"
            />
          )}
        />
      </FormSection>

      {/* Info note */}
      <div
        role="note"
        className="flex items-start gap-3 p-4 border rounded-2xl border-blue-300/50 bg-blue-50 dark:border-blue-400/30 dark:bg-blue-900/20"
      >
        <div className="flex-shrink-0 mt-0.5">
          <div className="inline-flex items-center justify-center w-6 h-6 text-blue-700 rounded-full bg-blue-100/70 ring-1 ring-blue-300/60 dark:bg-blue-400/10 dark:text-blue-200 dark:ring-blue-400/30">
            <Info className="w-4 h-4" />
          </div>
        </div>
        <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
          <strong className="font-semibold">Wskazówka:</strong> Dla prywatnych
          miejsc rozważ opcję <strong>Ukryte</strong> oraz{' '}
          <strong>Promień</strong> &gt; 0 aby zamaskować dokładny adres na
          mapie.
        </p>
      </div>
    </div>
  );
}
