'use client';

// TODO i18n: Polish strings need translation

import { useEffect, useState } from 'react';
import { UseFormReturn, useController, useWatch } from 'react-hook-form';
import { Crown, Info, User, Users } from 'lucide-react';

import { SegmentedControl } from '@/components/ui/segment-control';
import { RangeSlider } from '@/features/events';
import type { SimpleEventFormValues } from '@/features/events';

type ModeType = 'ONE_TO_ONE' | 'GROUP' | 'CUSTOM';

/**
 * SimpleCapacityStep - Simplified capacity step
 *
 * Features:
 * - Three modes: 1:1, Group, Custom (PRO)
 * - Simple slider for group mode
 * - PRO upsell for custom mode
 */
export function SimpleCapacityStep({
  form,
}: {
  form: UseFormReturn<SimpleEventFormValues>;
}) {
  const {
    setValue,
    trigger,
    control,
    formState: { errors },
  } = form;

  const { field: modeField } = useController({ name: 'mode', control });
  const minVal = useWatch({ control, name: 'min' });
  const maxVal = useWatch({ control, name: 'max' });

  const isOneToOne = modeField.value === 'ONE_TO_ONE';
  const isGroup = modeField.value === 'GROUP';
  const isCustom = modeField.value === 'CUSTOM';

  // For simplicity, we'll treat CUSTOM as GROUP with higher limits
  // Real PRO check would come from user context
  const [showProModal, setShowProModal] = useState(false);

  // Reset values when mode changes
  useEffect(() => {
    if (modeField.value === 'ONE_TO_ONE') {
      if (minVal !== 2 || maxVal !== 2) {
        setValue('min', 2, { shouldDirty: true, shouldValidate: true });
        setValue('max', 2, { shouldDirty: true, shouldValidate: true });
        void trigger(['min', 'max']);
      }
    } else if (modeField.value === 'GROUP') {
      if (minVal === 2 && maxVal === 2) {
        setValue('min', 1, { shouldDirty: true, shouldValidate: true });
        setValue('max', 10, { shouldDirty: true, shouldValidate: true });
        void trigger(['min', 'max']);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeField.value]);

  const handleSliderChange = ([a, b]: [number, number]) => {
    if (isOneToOne) return;
    setValue('min', a, { shouldDirty: true, shouldValidate: true });
    setValue('max', b, { shouldDirty: true, shouldValidate: true });
  };

  const handleModeChange = (mode: ModeType) => {
    if (mode === 'CUSTOM') {
      // Show PRO upsell modal
      setShowProModal(true);
      return;
    }
    modeField.onChange(mode);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Ilu uczestników?
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Wybierz tryb i ustaw liczbę uczestników.
        </p>
      </div>

      {/* Mode selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tryb wydarzenia
        </label>
        <SegmentedControl<ModeType>
          aria-label="Tryb"
          size="lg"
          withPill
          animated
          fullWidth
          value={modeField.value}
          onChange={handleModeChange}
          options={[
            { value: 'ONE_TO_ONE', label: '1:1', Icon: User },
            { value: 'GROUP', label: 'Grupowe', Icon: Users },
            {
              value: 'CUSTOM',
              label: (
                <span className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Niestandardowe
                </span>
              ) as any,
              Icon: undefined,
            },
          ]}
        />
      </div>

      {/* Mode description */}
      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
        {isOneToOne && (
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Spotkanie 1:1
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Idealne dla spotkań w parach — kawa, spacer, mentoring.
                Dokładnie 2 uczestników.
              </p>
            </div>
          </div>
        )}
        {isGroup && (
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Wydarzenie grupowe
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Ustaw minimalną i maksymalną liczbę uczestników (1-50). System
                może automatycznie zamknąć zapisy po osiągnięciu limitu.
              </p>
            </div>
          </div>
        )}
        {isCustom && (
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Tryb niestandardowy (PRO)
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Pełna kontrola nad limitami — dowolna liczba uczestników lub
                brak limitu. Dostępne w planie PRO.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Capacity slider for GROUP mode */}
      {isGroup && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Liczba uczestników
            </label>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {minVal ?? 1} – {maxVal ?? 50} osób
            </span>
          </div>

          {/* Visual preview */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(minVal ?? 1, 5) }).map((_, i) => (
                <User
                  key={`min-${i}`}
                  className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                />
              ))}
              {(minVal ?? 1) > 5 && (
                <span className="ml-1 text-xs font-medium text-zinc-500">
                  +{(minVal ?? 1) - 5}
                </span>
              )}
            </div>
            <span className="text-xs text-zinc-400">→</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(maxVal ?? 50, 5) }).map((_, i) => (
                <User
                  key={`max-${i}`}
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                />
              ))}
              {(maxVal ?? 50) > 5 && (
                <span className="ml-1 text-xs font-medium text-zinc-500">
                  +{(maxVal ?? 50) - 5}
                </span>
              )}
            </div>
          </div>

          <RangeSlider
            value={[minVal ?? 1, maxVal ?? 50]}
            min={1}
            max={50}
            step={1}
            onChange={handleSliderChange}
            className="mt-2"
          />

          {(errors.min || errors.max) && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {String(
                (errors.min?.message as string) ??
                  (errors.max?.message as string) ??
                  ''
              )}
            </p>
          )}
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 dark:text-indigo-100">
          Limity możesz później zmienić i doprecyzować w panelu wydarzenia.
        </p>
      </div>

      {/* PRO Upsell Modal */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl dark:bg-zinc-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Funkcja PRO
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Niestandardowe limity
                </p>
              </div>
            </div>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Pełne limity uczestników (1-99999 lub bez limitu) są dostępne w
              planie PRO. Uaktualnij swój plan, aby odblokować tę funkcję.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowProModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium border rounded-xl border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Zamknij
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProModal(false);
                  // Navigate to pricing page
                  window.open('/pricing', '_blank');
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500"
              >
                Zobacz plany
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
