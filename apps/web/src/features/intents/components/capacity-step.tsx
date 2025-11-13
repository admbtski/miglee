'use client';

import { Info, User, Users } from 'lucide-react';
import { useEffect, useId, useMemo } from 'react';
import { UseFormReturn, useController, useWatch } from 'react-hook-form';
import { IntentFormValues } from './types';
import { RangeSlider } from './range-slider';
import { SegmentedControl } from '@/components/ui/segment-control';

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
    watch,
    setValue,
    trigger,
    control,
    formState: { errors },
  } = form;

  // a11y ids (FIX: avoid duplicating IDs with the bottom note)
  const modeHelpId = useId();
  const capErrId = useId();
  const capHelpId = useId();
  const capNoteId = useId();

  const { field: modeField } = useController({ name: 'mode', control });

  const minVal = watch('min');
  const maxVal = watch('max');
  const categorySlugs = useWatch({ control, name: 'categorySlugs' }) ?? [];
  const isGroup = modeField.value === 'GROUP';

  // Smart defaults - suggest capacity based on first category
  const suggestedCapacity = useMemo(() => {
    if (!isGroup || categorySlugs.length === 0) return null;
    const firstCategory = categorySlugs[0];
    if (!firstCategory || typeof firstCategory !== 'string') return null;
    return CATEGORY_CAPACITY_DEFAULTS[firstCategory] ?? null;
  }, [isGroup, categorySlugs]);

  // Single source of truth for capacity sync
  useEffect(() => {
    if (modeField.value === 'ONE_TO_ONE') {
      setValue('min', 2, { shouldDirty: true, shouldValidate: true });
      setValue('max', 2, { shouldDirty: true, shouldValidate: true });
    } else if (modeField.value === 'GROUP') {
      setValue('min', 2, { shouldDirty: true, shouldValidate: true });
      setValue('max', 50, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    void trigger(['min', 'max']);
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
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Mode
        </label>
        <p
          id={modeHelpId}
          className="mb-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          In <b>1:1</b> mode capacity is fixed (2 people). In <b>Group</b> you
          can set the range (2–50).
        </p>

        <SegmentedControl<'ONE_TO_ONE' | 'GROUP'>
          aria-label="Mode"
          aria-describedby={modeHelpId}
          size="lg"
          withPill
          animated
          value={modeField.value}
          onChange={(next) => modeField.onChange(next)}
          options={[
            { value: 'ONE_TO_ONE', label: '1:1', Icon: User },
            { value: 'GROUP', label: 'Group', Icon: Users },
          ]}
          fullWidth
        />
      </div>

      {isGroup && (
        <div
          className={[
            'group rounded-2xl relative',
            !isGroup ? 'opacity-60' : '',
          ].join(' ')}
          aria-disabled={!isGroup}
        >
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Capacity
            </label>
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
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                title={`Apply suggested capacity for ${suggestedCapacity.label}`}
              >
                💡 Use {suggestedCapacity.label}
              </button>
            )}
          </div>

          <p
            id={capHelpId}
            className="mt-1 text-xs text-zinc-500 dark:text-zinc-400"
          >
            Set the minimum and maximum number of participants (drag the
            handles).
          </p>

          {/* Visual capacity preview */}
          <div className="mt-3 mb-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(minVal ?? 2, 10) }).map((_, i) => (
                <User
                  key={`min-${i}`}
                  className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
                  aria-hidden="true"
                />
              ))}
              {(minVal ?? 2) > 10 && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
                  +{(minVal ?? 2) - 10}
                </span>
              )}
            </div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">→</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(maxVal ?? 50, 10) }).map(
                (_, i) => (
                  <User
                    key={`max-${i}`}
                    className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                )
              )}
              {(maxVal ?? 50) > 10 && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
                  +{(maxVal ?? 50) - 10}
                </span>
              )}
            </div>
          </div>

          <RangeSlider
            value={[minVal ?? 2, maxVal ?? 50]}
            min={2}
            max={50}
            step={1}
            disabled={!isGroup}
            onChange={([a, b]) => {
              if (!isGroup) return;
              setValue('min', a, { shouldDirty: true, shouldValidate: true });
              setValue('max', b, { shouldDirty: true, shouldValidate: true });
            }}
            aria-invalid={!!(errors.min || errors.max)}
            aria-describedby={ariaDescribedBy}
            className="mt-[36px]"
          />

          {(errors.min || errors.max) && (
            <div
              id={capErrId}
              role="alert"
              aria-live="polite"
              className="mt-1 text-xs text-red-500"
            >
              {String(
                (errors.min?.message as string) ??
                  (errors.max?.message as string) ??
                  ''
              )}
            </div>
          )}
        </div>
      )}

      {/* Blue hint (use a distinct id) */}
      <div
        id={capNoteId}
        role="note"
        className="flex items-center gap-2 rounded-2xl border border-blue-300/50 bg-blue-50 p-3
                   text-blue-700 dark:border-blue-400/30 dark:bg-blue-900/20 dark:text-blue-200"
      >
        <span
          aria-hidden="true"
          className="mt-[1px] inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                     bg-blue-100/70 text-blue-700 ring-1 ring-blue-300/60
                     dark:bg-blue-400/10 dark:text-blue-200 dark:ring-blue-400/30"
        >
          <Info className="h-5 w-5" />
        </span>

        <p className="text-sm leading-[1.25]">
          {isGroup ? (
            <>
              Choose the <b>minimum</b> and <b>maximum</b> number of
              participants. The system can <b>auto-close</b> when it reaches
              capacity.
            </>
          ) : (
            <>
              In <b>1:1</b> mode the capacity is fixed to <b>2 people</b>. Use
              it for pair activities.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
