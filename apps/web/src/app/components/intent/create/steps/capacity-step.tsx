'use client';

import { Info, User, Users } from 'lucide-react';
import { useEffect, useId, useMemo } from 'react';
import { UseFormReturn, useController } from 'react-hook-form';
import { SegmentedControl } from '../../../../../../components/segment-control/segment-control';
import { IntentFormValues } from '../../types';
import { RangeSlider } from '../components/range-slider';

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

  // a11y ids
  const modeHelpId = useId();
  const capErrId = useId();
  const capHelpId = useId();

  // RHF binding for "mode"
  const { field: modeField } = useController({
    name: 'mode',
    control,
  });

  // reactive values
  const minVal = watch('min');
  const maxVal = watch('max');

  const isGroup = modeField.value === 'GROUP';

  // keep capacity in sync with mode
  useEffect(() => {
    if (modeField.value === 'ONE_TO_ONE') {
      setValue('min', 2, { shouldDirty: true, shouldValidate: true });
      setValue('max', 2, { shouldDirty: true, shouldValidate: true });
    } else if (modeField.value === 'GROUP') {
      setValue('min', 2, { shouldDirty: true, shouldValidate: true });
      setValue('max', 50, { shouldDirty: true, shouldValidate: true });
    }
    void trigger(['min', 'max']);
  }, [modeField.value, setValue, trigger]);

  // aria-describedby dla slidera
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
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          W trybie <b>1:1</b> pojemność jest stała (2 osoby). W trybie{' '}
          <b>Group</b> możesz ustawić zakres uczestników (2–50) poniżej.
        </p>

        <SegmentedControl<'ONE_TO_ONE' | 'GROUP'>
          aria-label="Mode"
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
        <>
          {/* Capacity (zawsze widoczne; disabled, gdy ONE_TO_ONE) */}
          <div
            className={[
              'group rounded-2xl relative',
              !isGroup ? 'opacity-60' : '',
            ].join(' ')}
            aria-disabled={!isGroup}
          >
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Capacity
            </label>

            {/* Helper pod labelką "Capacity" */}
            <p
              id={capHelpId}
              className="mt-1 text-xs text-zinc-500 dark:text-zinc-400"
            >
              Ustaw minimalną i maksymalną liczbę uczestników (przeciągnij
              uchwyty). Gdy liczba zgłoszeń osiągnie maksimum, wydarzenie
              zamknie się automatycznie.
            </p>

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
        </>
      )}

      {/* Niebieski hint na dole (spójny z poprzednim stepem) */}
      <div
        id={capHelpId}
        role="note"
        className="flex items-start gap-2 rounded-2xl border border-blue-300/50 bg-blue-50 p-3
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
              participants. A clear range helps others understand your
              expectations and lets the system <b>auto-close</b> the group when
              it reaches capacity.
            </>
          ) : (
            <>
              In <b>1:1</b> mode the capacity is fixed to <b>2 people</b>. Use
              it for pair activities like coffee chats, study sessions, or
              one-on-one training. Switch to <b>Group</b> to open the range.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
