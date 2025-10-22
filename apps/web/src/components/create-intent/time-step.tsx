'use client';

import { UseFormReturn, useWatch } from 'react-hook-form';
import { useCallback, useMemo } from 'react';
import { IntentFormValues } from './types';
import { Plus, Minus, Info } from 'lucide-react';

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
    getValues,
    formState: { errors },
  } = form;

  // --- const/helpers ---------------------------------------------------------
  const NOW_BUFFER_MS = 5 * 60 * 1000; // keep in sync with schema
  const roundStep = 15; // minutes for rounding / nudge
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

  // --- reactive --------------------------------------------------------------
  const startRaw = useWatch({ control, name: 'startAt' });
  const endRaw = useWatch({ control, name: 'endAt' });

  const start = coerceDate(startRaw, getValues('startAt'));
  const end = coerceDate(endRaw, getValues('endAt'));

  const durationMinutes = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60_000)
  );

  const durationLabel = (() => {
    const h = Math.floor(durationMinutes / 60);
    const m = durationMinutes % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  })();

  const durationOptions = useMemo(
    () => [15, 30, 45, 60, 90, 120, 180, 240] as const,
    []
  );

  // --- setters ---------------------------------------------------------------
  const setStart = useCallback(
    (nextStartIncoming: Date, keepDuration: boolean) => {
      const prevStart = coerceDate(getValues('startAt'));
      const prevEnd = coerceDate(getValues('endAt'));
      const delta = prevEnd.getTime() - prevStart.getTime();

      const nextStart = clampStartToBuffer(nextStartIncoming);

      setValue('startAt', nextStart, {
        shouldValidate: true,
        shouldDirty: true,
      });

      if (keepDuration && delta >= 0) {
        setValue('endAt', new Date(nextStart.getTime() + delta), {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else {
        const curEnd = coerceDate(getValues('endAt'));
        if (curEnd.getTime() < nextStart.getTime()) {
          setValue('endAt', addMinutes(nextStart, 60), {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    },
    [getValues, setValue]
  );

  const setEnd = useCallback(
    (nextEnd: Date) => {
      setValue('endAt', nextEnd, { shouldValidate: true, shouldDirty: true });
    },
    [setValue]
  );

  // --- handlers --------------------------------------------------------------
  const onStartDate = useCallback(
    (v: string) => {
      if (!v) return;
      const [y, m, d] = v.split('-').map(Number) as [number, number, number];

      setStart(setYMD(start, y, m, d), preserveDurationOnStartChange);
    },
    [setStart, start, preserveDurationOnStartChange]
  );

  const onStartTime = useCallback(
    (v: string) => {
      if (!v) return;
      const [hh, mm] = v.split(':').map(Number) as [number, number];

      setStart(setHM(start, hh, mm), preserveDurationOnStartChange);
    },
    [setStart, start, preserveDurationOnStartChange]
  );

  const onEndDate = useCallback(
    (v: string) => {
      if (!v) return;
      const [y, m, d] = v.split('-').map(Number) as [number, number, number];

      setEnd(setYMD(end, y, m, d));
    },
    [setEnd, end]
  );

  const onEndTime = useCallback(
    (v: string) => {
      if (!v) return;
      const [hh, mm] = v.split(':').map(Number) as [number, number];

      setEnd(setHM(end, hh, mm));
    },
    [setEnd, end]
  );

  // quick helpers
  const roundStartTo15 = useCallback(
    () => setStart(roundToNext(start, roundStep), true),
    [setStart, start]
  );

  const nudgeStart = useCallback(
    (minutes: number) =>
      setStart(addMinutes(start, minutes), preserveDurationOnStartChange),
    [setStart, start, preserveDurationOnStartChange]
  );

  const setDuration = useCallback(
    (mins: number) => setEnd(addMinutes(start, Math.max(0, mins))),
    [setEnd, start]
  );

  const setPreset = useCallback(
    (key: 'now1h' | 'tonight' | 'tomorrow' | 'weekend') => {
      const now = new Date();
      if (key === 'now1h') {
        const s = roundToNext(clampStartToBuffer(now), roundStep);
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
      // weekend
      const base = clampStartToBuffer(now);
      const s = new Date(base);
      const day = s.getDay(); // 0..6
      const offset = (6 - day + 7) % 7 || 7; // next Saturday
      s.setDate(s.getDate() + offset);
      s.setHours(10, 0, 0, 0);
      const e = addMinutes(s, 120);
      setValue('startAt', s, { shouldValidate: true, shouldDirty: true });
      setValue('endAt', e, { shouldValidate: true, shouldDirty: true });
    },
    [setValue]
  );

  // --- UI limits -------------------------------------------------------------
  const minStartDate = useMemo(() => toDateInput(new Date()), []);
  const minEndDate = toDateInput(start);

  return (
    <div className="space-y-8">
      {/* Quick actions */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Quick picks
        </label>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Ustaw start i koniec jednym kliknięciem albo dopasuj start do
          najbliższych 15&nbsp;min.
        </p>

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
            Tonight (18–20)
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

          <span className="mx-1 h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

          <button
            type="button"
            onClick={roundStartTo15}
            className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            title="Round start to nearest :15"
          >
            Round start to :15
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => nudgeStart(-roundStep)}
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              title={`Start -${roundStep} min`}
            >
              <Minus className="h-4 w-4" />
              {roundStep}m
            </button>
            <button
              type="button"
              onClick={() => nudgeStart(roundStep)}
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              title={`Start +${roundStep} min`}
            >
              <Plus className="h-4 w-4" />
              {roundStep}m
            </button>
          </div>
        </div>
      </div>

      {/* Start */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Start
        </label>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Start musi być co najmniej <b>5&nbsp;min</b> w przyszłości
          (automatycznie wymuszamy ten bufor).
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
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
            <input
              type="time"
              step={300}
              value={toTimeInput(start)}
              onChange={(e) => onStartTime(e.target.value)}
              className="mt-1 w-full rounded-2xl border px-4 py-3
                        border-zinc-300 bg-white text-zinc-900
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                        dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
            />
          </div>
        </div>
        <div className="mt-1 text-xs text-red-500">
          {errors.startAt?.message as string}
        </div>
      </div>

      {/* End + Duration */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            End
          </label>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Duration:&nbsp;<span className="font-medium">{durationLabel}</span>
          </div>
        </div>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Zakończenie musi być po starcie. Możesz szybko ustawić czas trwania
          presetami niżej.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
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

        {/* duration presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Quick duration:
          </span>
          {durationOptions.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDuration(m)}
              className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              title={`Set duration to ${m} min`}
            >
              {m}m
            </button>
          ))}
        </div>

        <div className="mt-1 text-xs text-red-500">
          {errors.endAt?.message as string}
        </div>
      </div>

      {/* Allow join late */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Joining
        </label>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Pozwól dołączyć po starcie — przydatne przy spotkaniach otwartych.
        </p>

        <label className="flex cursor-pointer items-center gap-3 select-none text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            {...register('allowJoinLate')}
            className="sr-only peer"
          />
          <div
            className="
              relative h-6 w-11 rounded-full bg-zinc-300 dark:bg-zinc-700
              transition-all duration-300
              peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-violet-500
              shadow-inner
            "
          >
            <span
              className="
                absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300
                peer-checked:translate-x-5
              "
            />
          </div>
          <span className="transition-colors duration-300 peer-checked:text-indigo-600 dark:peer-checked:text-indigo-400">
            Allow joining after start
          </span>
        </label>
      </div>

      {/* TZ note */}
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
          Czasy wyświetlane są w Twojej strefie:&nbsp;<b>{userTzLabel}</b>.
          Jeśli zapraszasz osoby z innych stref, rozważ dodanie krótkiej notki w
          opisie.
        </p>
      </div>

      {/* Collision tip (opcjonalnie) */}
      <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-3 text-amber-700 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-200 text-sm">
        Heads up: jeśli masz już nakładające się wydarzenia, dołączenie gdzie
        indziej może automatycznie zamknąć to ogłoszenie.
      </div>
    </div>
  );
}
