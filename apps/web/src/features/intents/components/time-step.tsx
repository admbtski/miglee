'use client';

import { UseFormReturn, useWatch } from 'react-hook-form';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { IntentFormValues } from './types';
import {
  Plus,
  Minus,
  Info,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

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
    () => [15, 30, 45, 60, 90, 120, 180, 240, 360, 480] as const,
    []
  );

  // Watch mode and join settings for smart features
  const mode = useWatch({ control, name: 'mode' });
  const joinOpens = useWatch({ control, name: 'joinOpensMinutesBeforeStart' });
  const joinCutoff = useWatch({
    control,
    name: 'joinCutoffMinutesBeforeStart',
  });
  const allowLate = useWatch({ control, name: 'allowJoinLate' });
  const lateCutoff = useWatch({
    control,
    name: 'lateJoinCutoffMinutesAfterStart',
  });

  // Duration calculator presets (defined early for useEffect)
  const durationPresets = useMemo(
    () => [
      { label: 'Coffee (30m)', minutes: 30, icon: '☕' },
      { label: 'Lunch (1h)', minutes: 60, icon: '🍽️' },
      { label: 'Workshop (2h)', minutes: 120, icon: '🎓' },
      { label: 'Half day (4h)', minutes: 240, icon: '📅' },
      { label: 'Full day (8h)', minutes: 480, icon: '🌅' },
      { label: 'Hackathon (12h)', minutes: 720, icon: '💻' },
    ],
    []
  );

  // Track last selected preset for visual feedback
  const [lastDurationPreset, setLastDurationPreset] = useState<number | null>(
    null
  );
  const [lastQuickPreset, setLastQuickPreset] = useState<string | null>(null);

  // Reset preset highlights when user manually changes time
  useEffect(() => {
    // When duration changes manually (not via preset), clear the highlight
    if (lastDurationPreset !== null && durationMinutes !== lastDurationPreset) {
      // Check if it's not one of our presets
      const isPreset =
        durationOptions.includes(durationMinutes as any) ||
        durationPresets.some((p) => p.minutes === durationMinutes);
      if (!isPreset) {
        setLastDurationPreset(null);
      }
    }
  }, [durationMinutes, lastDurationPreset, durationOptions, durationPresets]);

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
    (mins: number) => {
      setLastDurationPreset(mins);
      setEnd(addMinutes(start, Math.max(0, mins)));
    },
    [setEnd, start]
  );

  const setPreset = useCallback(
    (key: 'now1h' | 'tonight' | 'tomorrow' | 'weekend') => {
      setLastQuickPreset(key);
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

  // --- Join window presets ---------------------------------------------------
  const joinWindowPresets = useMemo(
    () => [
      {
        label: '🎉 Casual meetup',
        desc: 'Flexible, can join late',
        settings: {
          joinOpensMinutesBeforeStart: null,
          joinCutoffMinutesBeforeStart: null,
          allowJoinLate: true,
          lateJoinCutoffMinutesAfterStart: 30,
        },
      },
      {
        label: '📋 Structured event',
        desc: 'Closes 1h before, no late join',
        settings: {
          joinOpensMinutesBeforeStart: null,
          joinCutoffMinutesBeforeStart: 60,
          allowJoinLate: false,
          lateJoinCutoffMinutesAfterStart: null,
        },
      },
      {
        label: '🎓 Workshop',
        desc: 'Opens 7 days before, closes 24h before',
        settings: {
          joinOpensMinutesBeforeStart: 10080, // 7 days
          joinCutoffMinutesBeforeStart: 1440, // 24h
          allowJoinLate: false,
          lateJoinCutoffMinutesAfterStart: null,
        },
      },
      {
        label: '🚪 Drop-in session',
        desc: 'Open anytime during event',
        settings: {
          joinOpensMinutesBeforeStart: null,
          joinCutoffMinutesBeforeStart: null,
          allowJoinLate: true,
          lateJoinCutoffMinutesAfterStart: null,
        },
      },
    ],
    []
  );

  // --- Validation & warnings -------------------------------------------------
  const validationIssues = useMemo(() => {
    const issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
    }> = [];

    // Conflict: joinOpens > joinCutoff
    if (joinOpens != null && joinCutoff != null && joinOpens <= joinCutoff) {
      issues.push({
        type: 'error',
        message: 'Join opens time must be BEFORE cutoff time',
      });
    }

    // Warning: late cutoff > duration
    if (lateCutoff != null && lateCutoff > durationMinutes) {
      issues.push({
        type: 'warning',
        message: 'Late cutoff is after event ends',
      });
    }

    // Warning: very short join window for large events
    if (mode === 'GROUP' && joinCutoff != null && joinCutoff < 60) {
      issues.push({
        type: 'warning',
        message: 'Short join window (<1h) for group events',
      });
    }

    // Info: late join enabled but no cutoff
    if (allowLate && lateCutoff == null) {
      issues.push({
        type: 'info',
        message: 'Late join enabled until event ends',
      });
    }

    return issues;
  }, [joinOpens, joinCutoff, lateCutoff, durationMinutes, mode, allowLate]);

  // --- Timeline visualization data -------------------------------------------
  const timelineData = useMemo(() => {
    const points: Array<{
      label: string;
      offset: number;
      type: 'start' | 'end' | 'cutoff' | 'open';
    }> = [];

    if (joinOpens != null) {
      points.push({
        label: `Opens (${joinOpens}m before)`,
        offset: -joinOpens,
        type: 'open',
      });
    }
    if (joinCutoff != null) {
      points.push({
        label: `Cutoff (${joinCutoff}m before)`,
        offset: -joinCutoff,
        type: 'cutoff',
      });
    }
    points.push({ label: 'START', offset: 0, type: 'start' });
    if (allowLate && lateCutoff != null) {
      points.push({
        label: `Late cutoff (+${lateCutoff}m)`,
        offset: lateCutoff,
        type: 'cutoff',
      });
    }
    points.push({ label: 'END', offset: durationMinutes, type: 'end' });

    return points.sort((a, b) => a.offset - b.offset);
  }, [joinOpens, joinCutoff, allowLate, lateCutoff, durationMinutes]);

  // --- Handlers --------------------------------------------------------------
  const applyJoinPreset = useCallback(
    (preset: (typeof joinWindowPresets)[number]) => {
      setValue(
        'joinOpensMinutesBeforeStart',
        preset.settings.joinOpensMinutesBeforeStart,
        {
          shouldValidate: true,
          shouldDirty: true,
        }
      );
      setValue(
        'joinCutoffMinutesBeforeStart',
        preset.settings.joinCutoffMinutesBeforeStart,
        {
          shouldValidate: true,
          shouldDirty: true,
        }
      );
      setValue('allowJoinLate', preset.settings.allowJoinLate, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue(
        'lateJoinCutoffMinutesAfterStart',
        preset.settings.lateJoinCutoffMinutesAfterStart,
        {
          shouldValidate: true,
          shouldDirty: true,
        }
      );
    },
    [setValue]
  );

  const setAllDay = useCallback(() => {
    setLastQuickPreset('allday');
    const base = clampStartToBuffer(new Date());
    const s = new Date(base);
    s.setHours(8, 0, 0, 0);
    if (s.getTime() <= base.getTime()) s.setDate(s.getDate() + 1);
    const e = new Date(s);
    e.setHours(22, 0, 0, 0);
    setValue('startAt', s, { shouldValidate: true, shouldDirty: true });
    setValue('endAt', e, { shouldValidate: true, shouldDirty: true });
  }, [setValue]);

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
            className={`rounded-xl border px-3 py-1.5 text-sm transition-all ${
              lastQuickPreset === 'now1h'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-800'
                : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
            }`}
          >
            Now + 1h
          </button>
          <button
            type="button"
            onClick={() => setPreset('tonight')}
            className={`rounded-xl border px-3 py-1.5 text-sm transition-all ${
              lastQuickPreset === 'tonight'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-800'
                : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
            }`}
          >
            Tonight (18–20)
          </button>
          <button
            type="button"
            onClick={() => setPreset('tomorrow')}
            className={`rounded-xl border px-3 py-1.5 text-sm transition-all ${
              lastQuickPreset === 'tomorrow'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-800'
                : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
            }`}
          >
            Tomorrow evening
          </button>
          <button
            type="button"
            onClick={() => setPreset('weekend')}
            className={`rounded-xl border px-3 py-1.5 text-sm transition-all ${
              lastQuickPreset === 'weekend'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-800'
                : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
            }`}
          >
            Weekend (Sat 10–12)
          </button>
          <button
            type="button"
            onClick={setAllDay}
            className={`rounded-xl border px-3 py-1.5 text-sm transition-all ${
              lastQuickPreset === 'allday'
                ? 'border-indigo-500 bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200 dark:border-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-800'
                : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30'
            }`}
          >
            🌅 All day (8–22)
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

      {/* Duration Calculator */}
      <div>
        <label className="mb-1 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Clock className="h-4 w-4" />
          <span>Duration calculator</span>
        </label>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Szybko ustaw czas trwania na podstawie typu wydarzenia
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {durationPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setDuration(preset.minutes)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all ${
                lastDurationPreset === preset.minutes
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-800'
                  : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="text-base">{preset.icon}</span>
              <span className="truncate">{preset.label}</span>
            </button>
          ))}
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
          Zakończenie musi być po starcie. Możesz też użyć kalkulatora powyżej.
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
              className={`rounded-full border px-2.5 py-1 text-xs transition-all ${
                lastDurationPreset === m
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-800'
                  : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
              }`}
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

      {/* Join windows / cutoffs - Advanced options */}
      <details className="group rounded-2xl border border-zinc-300 dark:border-zinc-700">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50 rounded-2xl transition-colors select-none">
          <span className="flex items-center gap-2">
            <span>⚙️</span>
            <span>Advanced join settings</span>
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>

        <div className="space-y-4 px-4 pb-4 pt-2">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Kontroluj kiedy użytkownicy mogą dołączyć do wydarzenia. Pozostaw
              puste dla domyślnych ustawień.
            </p>
          </div>

          {/* Quick presets for join windows */}
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Quick presets
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {joinWindowPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyJoinPreset(preset)}
                  className="flex flex-col items-start gap-1 rounded-xl border border-zinc-300 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {preset.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Validation hints */}
          {validationIssues.length > 0 && (
            <div className="space-y-2">
              {validationIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                    issue.type === 'error'
                      ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
                      : issue.type === 'warning'
                        ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                        : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                  }`}
                >
                  {issue.type === 'error' && (
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  {issue.type === 'warning' && (
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  {issue.type === 'info' && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <span className="text-xs">{issue.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Timeline visualization */}
          {timelineData.length > 2 && (
            <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Timeline preview
              </label>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-zinc-300 dark:bg-zinc-600" />

                {/* Timeline points */}
                <div className="relative flex justify-between">
                  {timelineData.map((point, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div
                        className={`relative z-10 h-3 w-3 rounded-full ${
                          point.type === 'start'
                            ? 'bg-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
                            : point.type === 'end'
                              ? 'bg-zinc-500 ring-2 ring-zinc-200 dark:ring-zinc-700'
                              : point.type === 'open'
                                ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800'
                                : 'bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-800'
                        }`}
                      />
                      <span className="mt-1 text-[10px] text-zinc-600 dark:text-zinc-400 max-w-[60px] text-center leading-tight">
                        {point.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* joinOpensMinutesBeforeStart */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Otwórz zapisy przed startem (minuty)
            </label>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Ile minut przed startem otworzyć zapisy. Puste = zapisy otwarte od
              razu.
            </p>
            <input
              type="number"
              {...register('joinOpensMinutesBeforeStart', {
                valueAsNumber: true,
              })}
              placeholder="np. 60 (1 godzina)"
              min="0"
              max="10080"
              step="15"
              className="w-full rounded-2xl border px-4 py-2.5 text-sm
                      border-zinc-300 bg-white text-zinc-900
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                      dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100
                      placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
            {errors.joinOpensMinutesBeforeStart && (
              <div className="mt-1 text-xs text-red-500">
                {errors.joinOpensMinutesBeforeStart.message as string}
              </div>
            )}
          </div>

          {/* joinCutoffMinutesBeforeStart */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Zamknij zapisy przed startem (minuty)
            </label>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Ile minut przed startem zamknąć zapisy. Puste = zapisy otwarte do
              startu.
            </p>
            <input
              type="number"
              {...register('joinCutoffMinutesBeforeStart', {
                valueAsNumber: true,
              })}
              placeholder="np. 30 (30 minut)"
              min="0"
              max="10080"
              step="15"
              className="w-full rounded-2xl border px-4 py-2.5 text-sm
                      border-zinc-300 bg-white text-zinc-900
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                      dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100
                      placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
            {errors.joinCutoffMinutesBeforeStart && (
              <div className="mt-1 text-xs text-red-500">
                {errors.joinCutoffMinutesBeforeStart.message as string}
              </div>
            )}
          </div>

          {/* Allow join late */}
          <div>
            <label className="flex cursor-pointer items-center gap-3 select-none text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                {...register('allowJoinLate')}
                className="sr-only peer"
              />

              {/* tor + thumb jako ::after */}
              <div
                className="
      relative h-6 w-11 rounded-full
      bg-zinc-300 dark:bg-zinc-700
      transition-colors duration-300
      shadow-inner
      peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-violet-500

      after:content-[''] after:absolute after:left-1 after:top-1
      after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-md
      after:transition-all after:duration-300 after:ease-in-out
      after:transform
      peer-checked:after:translate-x-5
      peer-checked:after:shadow-[0_0_6px_rgba(99,102,241,0.6)]
    "
              />

              <span className="transition-colors duration-300 peer-checked:text-indigo-600 dark:peer-checked:text-indigo-400">
                Allow joining after start
              </span>
            </label>
            <p className="mt-1 ml-14 text-xs text-zinc-500 dark:text-zinc-400">
              Pozwól dołączyć po starcie — przydatne przy spotkaniach otwartych.
            </p>
          </div>

          {/* lateJoinCutoffMinutesAfterStart */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Zamknij spóźnione zapisy po starcie (minuty)
            </label>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Ile minut po starcie zamknąć możliwość dołączenia. Puste = do
              końca wydarzenia.
            </p>
            <input
              type="number"
              {...register('lateJoinCutoffMinutesAfterStart', {
                valueAsNumber: true,
              })}
              placeholder="np. 15 (15 minut)"
              min="0"
              max="10080"
              step="5"
              className="w-full rounded-2xl border px-4 py-2.5 text-sm
                      border-zinc-300 bg-white text-zinc-900
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                      dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100
                      placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
            {errors.lateJoinCutoffMinutesAfterStart && (
              <div className="mt-1 text-xs text-red-500">
                {errors.lateJoinCutoffMinutesAfterStart.message as string}
              </div>
            )}
          </div>
        </div>
      </details>

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
