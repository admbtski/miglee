'use client';

import { UseFormReturn, useWatch } from 'react-hook-form';
import { useMemo } from 'react';
import { IntentFormValues } from '../../types';
import { Plus, Minus } from 'lucide-react';

export function TimeStep({
  form,
  userTzLabel,
  preserveDurationOnStartChange = true,
}: {
  form: UseFormReturn<IntentFormValues>;
  userTzLabel: string; // e.g. "Europe/Warsaw (UTC+02:00)"
  preserveDurationOnStartChange?: boolean;
}) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = form;

  // Reactive form values
  const start = useWatch({ control, name: 'startAt' }) as Date;
  const end = useWatch({ control, name: 'endAt' }) as Date;
  const allowJoinLate = useWatch({ control, name: 'allowJoinLate' }) as boolean;

  // ---- helpers ----
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // Formatters (local, no UTC shifts)
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
    if (remainder !== 0) {
      next.setMinutes(mins + (minutesStep - remainder), 0, 0);
    } else {
      // keep seconds/millis clean
      next.setSeconds(0, 0);
    }
    return next;
  };

  const addMinutes = (d: Date, mins: number) =>
    new Date(d.getTime() + mins * 60_000);

  // Current duration (clamped at minimum 0)
  const durationMinutes = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60_000)
  );

  // Duration choices (tweak freely)
  const durationOptions = useMemo(
    () => [15, 30, 45, 60, 90, 120, 180, 240] as const,
    []
  );

  // ---- change handlers ----
  const onStartDate = (v: string) => {
    if (!v) return;
    const [y, m, d] = v.split('-').map(Number);
    const prevStart = new Date(start);
    const prevEnd = new Date(end);
    const delta = prevEnd.getTime() - prevStart.getTime();

    const nextStart = setYMD(prevStart, y, m, d);
    setValue('startAt', nextStart, { shouldValidate: true, shouldDirty: true });

    if (preserveDurationOnStartChange && delta >= 0) {
      setValue('endAt', new Date(nextStart.getTime() + delta), {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      // ensure end >= start
      if (end < nextStart) {
        setValue('endAt', addMinutes(nextStart, 60), {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  };

  const onStartTime = (v: string) => {
    if (!v) return;
    const [hh, mm] = v.split(':').map(Number);
    const prevStart = new Date(start);
    const prevEnd = new Date(end);
    const delta = prevEnd.getTime() - prevStart.getTime();

    const nextStart = setHM(prevStart, hh, mm);
    setValue('startAt', nextStart, { shouldValidate: true, shouldDirty: true });

    if (preserveDurationOnStartChange && delta >= 0) {
      setValue('endAt', new Date(nextStart.getTime() + delta), {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      if (end < nextStart) {
        setValue('endAt', addMinutes(nextStart, 60), {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  };

  const onEndDate = (v: string) => {
    if (!v) return;
    const [y, m, d] = v.split('-').map(Number);
    const nextEnd = setYMD(new Date(end), y, m, d);
    setValue('endAt', nextEnd, { shouldValidate: true, shouldDirty: true });
  };

  const onEndTime = (v: string) => {
    if (!v) return;
    const [hh, mm] = v.split(':').map(Number);
    const nextEnd = setHM(new Date(end), hh, mm);
    setValue('endAt', nextEnd, { shouldValidate: true, shouldDirty: true });
  };

  // Round start to nearest 15 and keep duration
  const roundStartTo15 = () => {
    const rounded = roundToNext(start, 15);
    const delta = end.getTime() - start.getTime();
    setValue('startAt', rounded, { shouldValidate: true, shouldDirty: true });
    if (preserveDurationOnStartChange && delta >= 0) {
      setValue('endAt', new Date(rounded.getTime() + delta), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  // Nudge start by ±15 minutes (preserving duration)
  const nudgeStart = (minutes: number) => {
    const delta = end.getTime() - start.getTime();
    const nextStart = addMinutes(start, minutes);
    setValue('startAt', nextStart, { shouldValidate: true, shouldDirty: true });
    if (preserveDurationOnStartChange && delta >= 0) {
      setValue('endAt', new Date(nextStart.getTime() + delta), {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else if (end < nextStart) {
      setValue('endAt', addMinutes(nextStart, 60), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  // Set end from duration
  const setDuration = (mins: number) => {
    setValue('endAt', addMinutes(start, Math.max(0, mins)), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Quick presets
  const setPreset = (key: 'now1h' | 'tonight' | 'tomorrow' | 'weekend') => {
    const now = new Date();
    if (key === 'now1h') {
      const s = roundToNext(now, 15);
      const e = addMinutes(s, 60);
      setValue('startAt', s, { shouldValidate: true, shouldDirty: true });
      setValue('endAt', e, { shouldValidate: true, shouldDirty: true });
      return;
    }
    if (key === 'tonight') {
      const s = new Date(now);
      s.setHours(18, 0, 0, 0);
      const e = addMinutes(s, 120);
      if (s < now) s.setDate(s.getDate() + 1); // if it's already past 18:00 today
      setValue('startAt', s, { shouldValidate: true, shouldDirty: true });
      setValue('endAt', e, { shouldValidate: true, shouldDirty: true });
      return;
    }
    if (key === 'tomorrow') {
      const s = new Date(now);
      s.setDate(s.getDate() + 1);
      s.setHours(18, 0, 0, 0);
      const e = addMinutes(s, 120);
      setValue('startAt', s, { shouldValidate: true, shouldDirty: true });
      setValue('endAt', e, { shouldValidate: true, shouldDirty: true });
      return;
    }
    if (key === 'weekend') {
      const s = new Date(now);
      const day = s.getDay(); // 0 = Sun, 6 = Sat
      const daysToSat = (6 - day + 7) % 7 || 7; // next Saturday (>= tomorrow)
      s.setDate(s.getDate() + daysToSat);
      s.setHours(10, 0, 0, 0);
      const e = addMinutes(s, 120);
      setValue('startAt', s, { shouldValidate: true, shouldDirty: true });
      setValue('endAt', e, { shouldValidate: true, shouldDirty: true });
      return;
    }
  };

  // UI guardrails
  const minStartDate = useMemo(() => toDateInput(new Date()), []);
  const minEndDate = toDateInput(start);

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPreset('now1h')}
          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Now + 1h
        </button>
        <button
          type="button"
          onClick={() => setPreset('tonight')}
          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Tonight (18:00–20:00)
        </button>
        <button
          type="button"
          onClick={() => setPreset('tomorrow')}
          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Tomorrow evening
        </button>
        <button
          type="button"
          onClick={() => setPreset('weekend')}
          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Weekend (Sat 10–12)
        </button>

        <div className="mx-2 h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

        <button
          type="button"
          onClick={roundStartTo15}
          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          title="Round start time up to nearest 15 minutes"
        >
          Round start to :15
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => nudgeStart(-15)}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            title="Start -15 min"
          >
            <Minus className="h-4 w-4" />
            15m
          </button>
          <button
            type="button"
            onClick={() => nudgeStart(15)}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            title="Start +15 min"
          >
            <Plus className="h-4 w-4" />
            15m
          </button>
        </div>
      </div>

      {/* Start */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Start date
          </label>
          <input
            type="date"
            value={toDateInput(start)}
            min={minStartDate}
            onChange={(e) => onStartDate(e.target.value)}
            className="mt-1 w-full rounded-2xl border px-4 py-3
                       border-zinc-300 bg-white text-zinc-900
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                       dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Start time
          </label>
          <input
            type="time"
            step={300} // 5 min arrows on mobile pickers
            value={toTimeInput(start)}
            onChange={(e) => onStartTime(e.target.value)}
            className="mt-1 w-full rounded-2xl border px-4 py-3
                       border-zinc-300 bg-white text-zinc-900
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                       dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
          />
        </div>
      </div>
      <div className="text-xs text-red-500">
        {errors.startAt?.message as string}
      </div>

      {/* End + Duration */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            End date
          </label>
          <input
            type="date"
            value={toDateInput(end)}
            min={minEndDate}
            onChange={(e) => onEndDate(e.target.value)}
            className="mt-1 w-full rounded-2xl border px-4 py-3
                       border-zinc-300 bg-white text-zinc-900
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                       dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              End time
            </label>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Duration:&nbsp;
              <select
                value={
                  durationOptions.includes(durationMinutes as any)
                    ? durationMinutes
                    : ''
                }
                onChange={(e) => {
                  const mins = Number(e.target.value);
                  if (Number.isFinite(mins)) setDuration(mins);
                }}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                title="Set end by duration"
              >
                <option value="">custom</option>
                {durationOptions.map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            type="time"
            step={300}
            value={toTimeInput(end)}
            onChange={(e) => onEndTime(e.target.value)}
            className="mt-1 w-full rounded-2xl border px-4 py-3
                       border-zinc-300 bg-white text-zinc-900
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                       dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
          />
        </div>
      </div>
      <div className="text-xs text-red-500">
        {errors.endAt?.message as string}
      </div>

      {/* Allow join late (pretty switch) */}
      <label className="mt-2 flex cursor-pointer items-center gap-3 select-none text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          {...register('allowJoinLate')}
          className="sr-only peer"
        />
        <div
          className={`
            relative h-6 w-11 rounded-full bg-zinc-300 dark:bg-zinc-700
            transition-all duration-300
            peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-violet-500
            shadow-inner
          `}
        >
          <span
            className={`
              absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300
              peer-checked:translate-x-5
            `}
          />
        </div>
        <span
          className={`
            transition-colors duration-300
            peer-checked:text-indigo-600 dark:peer-checked:text-indigo-400
          `}
        >
          Allow joining after start
        </span>
      </label>

      {/* TZ hint */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Time zone: {userTzLabel}
      </p>

      {/* Soft collision warning */}
      <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-3 text-amber-700 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-200">
        Heads up: if you already have overlapping intents today, joining
        elsewhere may auto-close this one.
      </div>
    </div>
  );
}
