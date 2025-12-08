'use client';

import { Clock, Info } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import type { SimpleEventFormValues } from '@/features/events/types/event-form';

/**
 * SimpleScheduleStep - Simplified schedule step with presets
 *
 * Features:
 * - Quick presets (Now +1h, Tonight, Tomorrow, Weekend)
 * - Simple date/time pickers
 * - Duration display
 */
export function SimpleScheduleStep({
  form,
}: {
  form: UseFormReturn<SimpleEventFormValues>;
}) {
  const {
    setValue,
    control,
    formState: { errors },
  } = form;

  const NOW_BUFFER_MS = 5 * 60 * 1000;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const coerceDate = (d: unknown, fallback?: Date) =>
    d instanceof Date && !isNaN(d.getTime()) ? d : (fallback ?? new Date());

  const clampStartToBuffer = (d: Date) => {
    const min = new Date(Date.now() + NOW_BUFFER_MS);
    return d.getTime() < min.getTime() ? min : d;
  };

  const toDateInput = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toTimeInput = (d: Date) =>
    `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const setYMD = (base: Date, yyyy: number, mm: number, dd: number) => {
    const next = new Date(base);
    next.setFullYear(yyyy, mm - 1, dd);
    return next;
  };

  const setHM = (base: Date, hh: number, mm: number) => {
    const next = new Date(base);
    next.setHours(hh, mm, 0, 0);
    return next;
  };

  const roundToNext = (d: Date, minutesStep: number) => {
    const next = new Date(d);
    const mins = next.getMinutes();
    const remainder = mins % minutesStep;
    if (remainder !== 0)
      next.setMinutes(mins + (minutesStep - remainder), 0, 0);
    else next.setSeconds(0, 0);
    return next;
  };

  const addMinutes = (d: Date, mins: number) =>
    new Date(d.getTime() + mins * 60_000);

  // Watch form values
  const startRaw = useWatch({ control, name: 'startAt' });
  const endRaw = useWatch({ control, name: 'endAt' });

  const start = coerceDate(startRaw);
  const end = coerceDate(endRaw);

  const durationMinutes = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60_000)
  );

  const durationLabel = (() => {
    const h = Math.floor(durationMinutes / 60);
    const m = durationMinutes % 60;
    if (h && m) return `${h}h ${m}min`;
    if (h) return `${h}h`;
    return `${m}min`;
  })();

  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Presets
  const presets = useMemo(
    () => [
      { key: 'now1h', label: 'Teraz +1h', icon: '⚡' },
      { key: 'tonight', label: 'Dziś wieczorem', icon: '🌙' },
      { key: 'tomorrow', label: 'Jutro', icon: '📅' },
      { key: 'weekend', label: 'Weekend', icon: '🎉' },
    ],
    []
  );

  const applyPreset = useCallback(
    (key: string) => {
      setActivePreset(key);
      const now = new Date();

      if (key === 'now1h') {
        const s = roundToNext(clampStartToBuffer(now), 15);
        const e = addMinutes(s, 60);
        setValue('startAt', s, { shouldValidate: true, shouldDirty: true });
        setValue('endAt', e, { shouldValidate: true, shouldDirty: true });
        return;
      }

      if (key === 'tonight') {
        const base = clampStartToBuffer(now);
        const s = new Date(base);
        s.setHours(18, 0, 0, 0);
        if (s.getTime() <= base.getTime()) s.setDate(s.getDate() + 1);
        const e = addMinutes(s, 120);
        setValue('startAt', s, { shouldValidate: true, shouldDirty: true });
        setValue('endAt', e, { shouldValidate: true, shouldDirty: true });
        return;
      }

      if (key === 'tomorrow') {
        const base = clampStartToBuffer(now);
        const s = new Date(base);
        s.setDate(s.getDate() + 1);
        s.setHours(18, 0, 0, 0);
        const e = addMinutes(s, 120);
        setValue('startAt', s, { shouldValidate: true, shouldDirty: true });
        setValue('endAt', e, { shouldValidate: true, shouldDirty: true });
        return;
      }

      if (key === 'weekend') {
        const base = clampStartToBuffer(now);
        const s = new Date(base);
        const day = s.getDay();
        const offset = (6 - day + 7) % 7 || 7;
        s.setDate(s.getDate() + offset);
        s.setHours(10, 0, 0, 0);
        const e = addMinutes(s, 120);
        setValue('startAt', s, { shouldValidate: true, shouldDirty: true });
        setValue('endAt', e, { shouldValidate: true, shouldDirty: true });
      }
    },
    [setValue]
  );

  // Handlers
  const onStartDate = useCallback(
    (v: string) => {
      if (!v) return;
      const [y, m, d] = v.split('-').map(Number) as [number, number, number];
      const newStart = clampStartToBuffer(setYMD(start, y, m, d));
      const delta = end.getTime() - start.getTime();
      setValue('startAt', newStart, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('endAt', new Date(newStart.getTime() + delta), {
        shouldValidate: true,
        shouldDirty: true,
      });
      setActivePreset(null);
    },
    [start, end, setValue]
  );

  const onStartTime = useCallback(
    (v: string) => {
      if (!v) return;
      const [hh, mm] = v.split(':').map(Number) as [number, number];
      const newStart = clampStartToBuffer(setHM(start, hh, mm));
      const delta = end.getTime() - start.getTime();
      setValue('startAt', newStart, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('endAt', new Date(newStart.getTime() + delta), {
        shouldValidate: true,
        shouldDirty: true,
      });
      setActivePreset(null);
    },
    [start, end, setValue]
  );

  const onEndDate = useCallback(
    (v: string) => {
      if (!v) return;
      const [y, m, d] = v.split('-').map(Number) as [number, number, number];
      setValue('endAt', setYMD(end, y, m, d), {
        shouldValidate: true,
        shouldDirty: true,
      });
      setActivePreset(null);
    },
    [end, setValue]
  );

  const onEndTime = useCallback(
    (v: string) => {
      if (!v) return;
      const [hh, mm] = v.split(':').map(Number) as [number, number];
      setValue('endAt', setHM(end, hh, mm), {
        shouldValidate: true,
        shouldDirty: true,
      });
      setActivePreset(null);
    },
    [end, setValue]
  );

  const minStartDate = useMemo(() => toDateInput(new Date()), []);
  const minEndDate = toDateInput(start);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Kiedy się spotykamy?
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Wybierz datę i godzinę rozpoczęcia oraz zakończenia.
        </p>
      </div>

      {/* Quick presets */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Szybki wybór
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset.key)}
              className={[
                'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                activePreset === preset.key
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-800'
                  : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:text-zinc-300',
              ].join(' ')}
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Start date/time */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Początek <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={toDateInput(start)}
            min={minStartDate}
            onChange={(e) => onStartDate(e.target.value)}
            className="w-full px-4 py-3 bg-white border rounded-xl border-zinc-300 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
          />
          <input
            type="time"
            step={300}
            value={toTimeInput(start)}
            onChange={(e) => onStartTime(e.target.value)}
            className="w-full px-4 py-3 bg-white border rounded-xl border-zinc-300 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
          />
        </div>
        {errors.startAt && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.startAt.message as string}
          </p>
        )}
      </div>

      {/* End date/time */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Koniec <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <Clock className="w-4 h-4" />
            <span>
              Czas trwania:{' '}
              <strong className="text-zinc-700 dark:text-zinc-300">
                {durationLabel}
              </strong>
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={toDateInput(end)}
            min={minEndDate}
            onChange={(e) => onEndDate(e.target.value)}
            className="w-full px-4 py-3 bg-white border rounded-xl border-zinc-300 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
          />
          <input
            type="time"
            step={300}
            value={toTimeInput(end)}
            onChange={(e) => onEndTime(e.target.value)}
            className="w-full px-4 py-3 bg-white border rounded-xl border-zinc-300 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
          />
        </div>
        {errors.endAt && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.endAt.message as string}
          </p>
        )}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 dark:text-indigo-100">
          Zaawansowane ustawienia (okna zapisów, spóźnione dołączanie) ustawisz
          w panelu wydarzenia po jego utworzeniu.
        </p>
      </div>
    </div>
  );
}
