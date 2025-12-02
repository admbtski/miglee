'use client';

import { Infinity, Info, Settings, User, Users } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { UseFormReturn, useController, useWatch } from 'react-hook-form';
import { IntentFormValues } from './types';
import { RangeSlider } from './range-slider';
import { SegmentedControl } from '@/components/ui/segment-control';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

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

// ============================================================================
// CONSTANTS
// ============================================================================

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CapacityStep({
  form,
}: {
  form: UseFormReturn<IntentFormValues>;
}) {
  const {
    setValue,
    trigger,
    control,
    formState: { errors },
  } = form;

  // --------------------------------------------------------------------------
  // LOCAL STATE
  // --------------------------------------------------------------------------

  // Input values (only synced on blur to prevent premature updates)
  const [localMinInput, setLocalMinInput] = useState<string>('');
  const [localMaxInput, setLocalMaxInput] = useState<string>('');

  // Checkbox states for unlimited options
  const [isMinUnlimited, setIsMinUnlimited] = useState<boolean>(false);
  const [isMaxUnlimited, setIsMaxUnlimited] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // FORM VALUES & DERIVED STATE
  // --------------------------------------------------------------------------

  const { field: modeField } = useController({ name: 'mode', control });
  const minVal = useWatch({ control, name: 'min' });
  const maxVal = useWatch({ control, name: 'max' });
  const categorySlugs = useWatch({ control, name: 'categorySlugs' }) ?? [];

  const isGroup = modeField.value === 'GROUP';
  const isCustom = modeField.value === 'CUSTOM';
  const isOneToOne = modeField.value === 'ONE_TO_ONE';

  // --------------------------------------------------------------------------
  // ACCESSIBILITY IDS
  // --------------------------------------------------------------------------

  const modeHelpId = useId();
  const capErrId = useId();
  const capHelpId = useId();
  const capNoteId = useId();

  const ariaDescribedBy = useMemo(() => {
    const ids: string[] = [capHelpId];
    if (errors.min || errors.max) ids.push(capErrId);
    return ids.join(' ');
  }, [capHelpId, capErrId, errors.min, errors.max]);

  // --------------------------------------------------------------------------
  // SMART SUGGESTIONS
  // --------------------------------------------------------------------------

  const suggestedCapacity = useMemo(() => {
    if (!isGroup || categorySlugs.length === 0) return null;
    const firstCategory = categorySlugs[0];
    if (!firstCategory || typeof firstCategory !== 'string') return null;
    return CATEGORY_CAPACITY_DEFAULTS[firstCategory] ?? null;
  }, [isGroup, categorySlugs]);

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------

  // Sync local input state with form values
  useEffect(() => {
    setLocalMinInput(minVal !== null ? String(minVal) : '');
    setIsMinUnlimited(minVal === null);
  }, [minVal]);

  useEffect(() => {
    setLocalMaxInput(maxVal !== null ? String(maxVal) : '');
    setIsMaxUnlimited(maxVal === null);
  }, [maxVal]);

  // Reset values when mode changes
  useEffect(() => {
    if (modeField.value === 'ONE_TO_ONE') {
      if (minVal !== 2 || maxVal !== 2) {
        setValue('min', 2, { shouldDirty: true, shouldValidate: true });
        setValue('max', 2, { shouldDirty: true, shouldValidate: true });
        void trigger(['min', 'max']);
      }
    } else if (modeField.value === 'GROUP') {
      setValue('min', 1, { shouldDirty: true, shouldValidate: true });
      setValue('max', 50, { shouldDirty: true, shouldValidate: true });
      void trigger(['min', 'max']);
    } else if (modeField.value === 'CUSTOM') {
      setValue('min', 1, { shouldDirty: true, shouldValidate: true });
      setValue('max', 99999, { shouldDirty: true, shouldValidate: true });
      void trigger(['min', 'max']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeField.value]);

  // --------------------------------------------------------------------------
  // CALLBACKS
  // --------------------------------------------------------------------------

  // Memoized slider change handler (prevents stale closures)
  const handleSliderChange = useCallback(
    ([a, b]: [number, number]) => {
      if (isOneToOne) return;

      // When min is unlimited, only update max
      if (isCustom && isMinUnlimited) {
        setValue('max', b, { shouldDirty: true, shouldValidate: true });
        return;
      }

      // When max is unlimited, only update min
      if (isCustom && isMaxUnlimited) {
        setValue('min', a, { shouldDirty: true, shouldValidate: true });
        return;
      }

      // Normal case: update both
      setValue('min', a, { shouldDirty: true, shouldValidate: true });
      setValue('max', b, { shouldDirty: true, shouldValidate: true });
    },
    [isOneToOne, isCustom, isMinUnlimited, isMaxUnlimited, setValue]
  );

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Mode Selection */}
      <FormSection
        title="Tryb"
        description="Wybierz tryb wydarzenia: 1:1 (2 osoby), grupowy (1–50 osób) lub niestandardowy (pełna kontrola nad limitem uczestników 1-99999)."
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

      {/* Capacity Controls (only for GROUP and CUSTOM modes) */}
      {(isGroup || isCustom) && (
        <div className="space-y-4">
          {/* Header with Smart Suggestion */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Liczba uczestników
              </label>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {isCustom
                  ? 'Ustaw dowolną minimalną i maksymalną liczbę uczestników (99999).'
                  : 'Ustaw minimalną i maksymalną liczbę uczestników (1-50) przeciągając suwaki.'}
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

          {/* Visual Capacity Preview */}
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
                  {Array.from({ length: Math.min(maxVal, 10) }).map((_, i) => (
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

          {/* Range Slider */}
          <RangeSlider
            value={[
              isMinUnlimited ? 1 : (minVal ?? 1),
              isMaxUnlimited ? 99999 : (maxVal ?? 99999),
            ]}
            min={1}
            max={isCustom ? 99999 : 50}
            step={1}
            disabled={
              isOneToOne || (isCustom && isMinUnlimited && isMaxUnlimited)
            }
            disableLeftThumb={isMinUnlimited}
            disableRightThumb={isMaxUnlimited}
            onChange={handleSliderChange}
            aria-invalid={!!(errors.min || errors.max)}
            aria-describedby={ariaDescribedBy}
            className="mt-2"
          />

          {/* Custom Mode: Toggle Switches & Manual Inputs */}
          {isCustom && (
            <div className="space-y-4 pt-2">
              {/* Toggle Switches for Unlimited Options */}
              <div className="flex flex-wrap gap-4">
                {/* Minimum Unlimited Toggle */}
                <label className="group flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isMinUnlimited}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsMinUnlimited(checked);
                        setValue('min', checked ? null : 1, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-indigo-600"></div>
                  </div>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <Infinity className="w-4 h-4" />
                    Bez minimalnego limitu
                  </span>
                </label>

                {/* Maximum Unlimited Toggle */}
                <label className="group flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isMaxUnlimited}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsMaxUnlimited(checked);
                        setValue('max', checked ? null : 99999, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-indigo-600"></div>
                  </div>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <Infinity className="w-4 h-4" />
                    Bez maksymalnego limitu
                  </span>
                </label>
              </div>

              {/* Manual Number Inputs */}
              <div className="grid grid-cols-2 gap-4">
                {/* Minimum Input */}
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
                    disabled={isMinUnlimited}
                    value={localMinInput}
                    onChange={(e) => setLocalMinInput(e.target.value)}
                    onBlur={() => {
                      if (isMinUnlimited) return;

                      const parsed = parseInt(localMinInput, 10);
                      if (isNaN(parsed) || localMinInput === '') {
                        setLocalMinInput(String(minVal));
                        return;
                      }

                      // Round to nearest 10 and clamp
                      const rounded = Math.round(parsed / 10) * 10;
                      const clamped = Math.max(1, Math.min(99999, rounded));

                      setValue('min', clamped, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    placeholder={isMinUnlimited ? '∞ Bez limitu' : '1'}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Maximum Input */}
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
                    disabled={isMaxUnlimited}
                    value={localMaxInput}
                    onChange={(e) => setLocalMaxInput(e.target.value)}
                    onBlur={() => {
                      if (isMaxUnlimited) return;

                      const parsed = parseInt(localMaxInput, 10);
                      if (isNaN(parsed) || localMaxInput === '') {
                        setLocalMaxInput(String(maxVal));
                        return;
                      }

                      // Round to nearest 10 and clamp
                      const rounded = Math.round(parsed / 10) * 10;
                      const clamped = Math.max(1, Math.min(99999, rounded));

                      setValue('max', clamped, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    placeholder={isMaxUnlimited ? '∞ Bez limitu' : '10'}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Info Banner for Unlimited Options */}
              {(isMinUnlimited || isMaxUnlimited) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-indigo-900 dark:text-indigo-100">
                    {isMinUnlimited && isMaxUnlimited
                      ? 'Wydarzenie bez ograniczeń pojemności – każdy może dołączyć.'
                      : isMinUnlimited
                        ? `Wydarzenie bez minimalnej liczby uczestników, maksymalnie ${maxVal} osób.`
                        : `Wydarzenie bez maksymalnej liczby uczestników, minimum ${minVal} osób.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Messages */}
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

      {/* Info Hint */}
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
          {isCustom ? (
            <>
              W trybie{' '}
              <strong className="font-semibold">niestandardowym</strong> masz
              pełną kontrolę nad limitami uczestników. Możesz ustawić{' '}
              <strong className="font-semibold">dowolny zakres</strong>{' '}
              (1-99999) lub całkowicie usunąć ograniczenia, zaznaczając
              odpowiednie opcje. Wartości są zaokrąglane do najbliższej 10.
            </>
          ) : isGroup ? (
            <>
              Wybierz <strong className="font-semibold">minimalną</strong> i{' '}
              <strong className="font-semibold">maksymalną</strong> liczbę
              uczestników (1-50). System może{' '}
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
