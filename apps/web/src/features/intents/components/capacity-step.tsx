'use client';

import { Infinity, Info, Settings, User, Users } from 'lucide-react';
import { useEffect, useId, useMemo } from 'react';
import { UseFormReturn, useController, useWatch } from 'react-hook-form';
import { IntentFormValues } from './types';
import { RangeSlider } from './range-slider';
import { SegmentedControl } from '@/components/ui/segment-control';

function FormSection({
  title,
  description,
  children,
  error,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  error?: string;
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
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <span className="text-base">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

// Smart defaults based on category
const CATEGORY_CAPACITY_DEFAULTS: Record<
  string,
  { min: number; max: number; label: string }
> = {
  coffee: { min: 2, max: 4, label: 'Coffee chat (2-4)' },
  lunch: { min: 2, max: 6, label: 'Lunch (2-6)' },
  dinner: { min: 2, max: 8, label: 'Dinner (2-8)' },
  boardgames: { min: 3, max: 6, label: 'Board games (3-6)' },
  coding: { min: 4, max: 12, label: 'Coding session (4-12)' },
  workshop: { min: 5, max: 20, label: 'Workshop (5-20)' },
  sports: { min: 6, max: 20, label: 'Sports (6-20)' },
  hiking: { min: 4, max: 15, label: 'Hiking (4-15)' },
  running: { min: 3, max: 10, label: 'Running (3-10)' },
  cycling: { min: 3, max: 15, label: 'Cycling (3-15)' },
  yoga: { min: 5, max: 15, label: 'Yoga (5-15)' },
  meditation: { min: 3, max: 20, label: 'Meditation (3-20)' },
  networking: { min: 10, max: 50, label: 'Networking (10-50)' },
  conference: { min: 20, max: 50, label: 'Conference (20-50)' },
  meetup: { min: 5, max: 30, label: 'Meetup (5-30)' },
};

export function CapacityStep({
  form,
}: {
  form: UseFormReturn<IntentFormValues>;
}) {
  const {
    setValue,
    trigger,
    control,
    formState: { errors, defaultValues },
  } = form;

  // a11y ids (FIX: avoid duplicating IDs with the bottom note)
  const modeHelpId = useId();
  const capErrId = useId();
  const capHelpId = useId();
  const capNoteId = useId();

  const { field: modeField } = useController({ name: 'mode', control });

  const minVal = useWatch({ control, name: 'min' });
  const maxVal = useWatch({ control, name: 'max' });
  const categorySlugs = useWatch({ control, name: 'categorySlugs' }) ?? [];
  const isGroup = modeField.value === 'GROUP';
  const isCustom = modeField.value === 'CUSTOM';
  const isOneToOne = modeField.value === 'ONE_TO_ONE';

  // Smart defaults - suggest capacity based on first category
  const suggestedCapacity = useMemo(() => {
    if (!isGroup || categorySlugs.length === 0) return null;
    const firstCategory = categorySlugs[0];
    if (!firstCategory || typeof firstCategory !== 'string') return null;
    return CATEGORY_CAPACITY_DEFAULTS[firstCategory] ?? null;
  }, [isGroup, categorySlugs]);

  // Single source of truth for capacity sync
  // Only update when mode changes AND values don't match expected values
  useEffect(() => {
    if (modeField.value === 'ONE_TO_ONE') {
      // Only update if values are not already 2,2
      if (minVal !== 2 || maxVal !== 2) {
        setValue('min', 2, { shouldDirty: true, shouldValidate: true });
        setValue('max', 2, { shouldDirty: true, shouldValidate: true });
        void trigger(['min', 'max']);
      }
    } else if (modeField.value === 'GROUP') {
      // Only update if switching FROM one_to_one (both values are 2)
      if (minVal === 2 && maxVal === 2) {
        // Reset to initial values from form defaults (from database)
        const initialMin = defaultValues?.min ?? 2;
        const initialMax = defaultValues?.max ?? 50;

        setValue('min', initialMin, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue('max', initialMax, {
          shouldDirty: true,
          shouldValidate: true,
        });
        void trigger(['min', 'max']);
      }
    } else if (modeField.value === 'CUSTOM') {
      // For CUSTOM mode, keep current values or set sensible defaults
      if (minVal === 2 && maxVal === 2) {
        const initialMin = defaultValues?.min ?? 1;
        const initialMax = defaultValues?.max ?? 10;
        setValue('min', initialMin, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue('max', initialMax, {
          shouldDirty: true,
          shouldValidate: true,
        });
        void trigger(['min', 'max']);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeField.value]);

  const ariaDescribedBy = useMemo(() => {
    const ids: string[] = [capHelpId];
    if (errors.min || errors.max) ids.push(capErrId);
    return ids.join(' ');
  }, [capHelpId, capErrId, errors.min, errors.max]);

  return (
    <div className="space-y-8">
      {/* Mode */}
      <FormSection
        title="Tryb"
        description="Wybierz tryb wydarzenia: 1:1 (2 osoby), grupowy (2–50 osób) lub niestandardowy (pełna kontrola nad limitem uczestników)."
      >
        <SegmentedControl<'ONE_TO_ONE' | 'GROUP' | 'CUSTOM'>
          aria-label="Tryb"
          aria-describedby={modeHelpId}
          size="lg"
          withPill
          animated
          value={modeField.value}
          onChange={(next) => modeField.onChange(next)}
          options={[
            { value: 'ONE_TO_ONE', label: '1:1', Icon: User },
            { value: 'GROUP', label: 'Grupowe', Icon: Users },
            { value: 'CUSTOM', label: 'Niestandardowe', Icon: Settings },
          ]}
          fullWidth
        />
      </FormSection>

      {(isGroup || isCustom) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Liczba uczestników
              </label>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {isCustom
                  ? 'Ustaw dowolną minimalną i maksymalną liczbę uczestników (1–99999).'
                  : 'Ustaw minimalną i maksymalną liczbę uczestników (przeciągnij suwaki).'}
              </p>
            </div>
            {suggestedCapacity && (
              <button
                type="button"
                onClick={() => {
                  setValue('min', suggestedCapacity.min, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue('max', suggestedCapacity.max, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-colors"
                title={`Zastosuj sugerowaną liczność dla ${suggestedCapacity.label}`}
              >
                💡 Użyj {suggestedCapacity.label}
              </button>
            )}
          </div>

          {/* Visual capacity preview */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-1">
              {minVal === null ? (
                <div className="flex items-center gap-1">
                  <Infinity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    Bez min
                  </span>
                </div>
              ) : (
                <>
                  {Array.from({ length: Math.min(minVal, 10) }).map((_, i) => (
                    <User
                      key={`min-${i}`}
                      className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                      aria-hidden="true"
                    />
                  ))}
                  {minVal > 10 && (
                    <span className="ml-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                      +{minVal - 10}
                    </span>
                  )}
                </>
              )}
            </div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">→</span>
            <div className="flex items-center gap-1">
              {maxVal === null ? (
                <div className="flex items-center gap-1">
                  <Infinity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Bez max
                  </span>
                </div>
              ) : (
                <>
                  {Array.from({
                    length: Math.min(maxVal, 10),
                  }).map((_, i) => (
                    <User
                      key={`max-${i}`}
                      className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                  ))}
                  {maxVal > 10 && (
                    <span className="ml-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                      +{maxVal - 10}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <RangeSlider
            value={[
              minVal ?? (isCustom ? 1 : 2),
              maxVal ?? (isCustom ? 10 : 50),
            ]}
            min={isCustom ? 1 : 2}
            max={isCustom ? 99999 : 50}
            step={1}
            disabled={
              isOneToOne || (isCustom && (minVal === null || maxVal === null))
            }
            onChange={([a, b]) => {
              if (isOneToOne) return;
              if (isCustom && minVal === null) {
                // Only update max if min is unlimited
                setValue('max', b, { shouldDirty: true, shouldValidate: true });
              } else if (isCustom && maxVal === null) {
                // Only update min if max is unlimited
                setValue('min', a, { shouldDirty: true, shouldValidate: true });
              } else {
                setValue('min', a, { shouldDirty: true, shouldValidate: true });
                setValue('max', b, { shouldDirty: true, shouldValidate: true });
              }
            }}
            aria-invalid={!!(errors.min || errors.max)}
            aria-describedby={ariaDescribedBy}
            className="mt-2"
          />

          {/* CUSTOM mode: Manual inputs and unlimited checkboxes */}
          {isCustom && (
            <div className="space-y-4 pt-2">
              {/* Checkboxes */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={minVal === null}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setValue('min', null, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      } else {
                        setValue('min', 1, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800"
                  />
                  <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <Infinity className="w-4 h-4" />
                    Bez minimalnych ograniczeń
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maxVal === null}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setValue('max', null, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      } else {
                        setValue('max', 10, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800"
                  />
                  <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    <Infinity className="w-4 h-4" />
                    Bez górnych ograniczeń
                  </span>
                </label>
              </div>

              {/* Manual number inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="capacity-min-input"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Minimum
                  </label>
                  <input
                    id="capacity-min-input"
                    type="number"
                    min={1}
                    max={99999}
                    disabled={minVal === null}
                    value={minVal ?? ''}
                    onChange={(e) => {
                      const val =
                        e.target.value === '' ? null : parseInt(e.target.value);
                      setValue('min', val, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    placeholder={minVal === null ? '∞ Bez limitu' : '1'}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor="capacity-max-input"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Maximum
                  </label>
                  <input
                    id="capacity-max-input"
                    type="number"
                    min={1}
                    max={99999}
                    disabled={maxVal === null}
                    value={maxVal ?? ''}
                    onChange={(e) => {
                      const val =
                        e.target.value === '' ? null : parseInt(e.target.value);
                      setValue('max', val, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    placeholder={maxVal === null ? '∞ Bez limitu' : '10'}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Info banner */}
              {(minVal === null || maxVal === null) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-indigo-900 dark:text-indigo-100">
                    {minVal === null && maxVal === null
                      ? 'Wydarzenie bez ograniczeń pojemności – każdy może dołączyć.'
                      : minVal === null
                        ? `Wydarzenie bez minimalnej liczby uczestników, maksymalnie ${maxVal} osób.`
                        : `Wydarzenie bez maksymalnej liczby uczestników, minimum ${minVal} osób.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {(errors.min || errors.max) && (
            <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <span className="text-base">⚠️</span>
              {String(
                (errors.min?.message as string) ??
                  (errors.max?.message as string) ??
                  ''
              )}
            </p>
          )}
        </div>
      )}

      {/* Info hint */}
      <div
        id={capNoteId}
        role="note"
        className="flex items-start gap-3 p-4 border rounded-2xl border-blue-300/50 bg-blue-50 dark:border-blue-400/30 dark:bg-blue-900/20"
      >
        <div className="flex-shrink-0 mt-0.5">
          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100/70 text-blue-700 ring-1 ring-blue-300/60 dark:bg-blue-400/10 dark:text-blue-200 dark:ring-blue-400/30">
            <Info className="w-4 h-4" />
          </div>
        </div>

        <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
          {isGroup ? (
            <>
              Wybierz <strong className="font-semibold">minimalną</strong> i{' '}
              <strong className="font-semibold">maksymalną</strong> liczbę
              uczestników. System może{' '}
              <strong className="font-semibold">automatycznie zamknąć</strong>{' '}
              zapisy po osiągnięciu limitu.
            </>
          ) : (
            <>
              W trybie <strong className="font-semibold">1:1</strong> liczba
              uczestników jest stała:{' '}
              <strong className="font-semibold">2 osoby</strong>. Użyj tego
              trybu dla aktywności w parach.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
