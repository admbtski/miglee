'use client';

import { UseFormReturn } from 'react-hook-form';
import { IntentFormValues } from '../../types';

export function TimeStep({
  form,
  userTzLabel,
}: {
  form: UseFormReturn<IntentFormValues>;
  userTzLabel: string; // e.g. "Europe/Warsaw (UTC+02:00)"
}) {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const start = watch('startAt');
  const end = watch('endAt');

  // Helpers to keep date & time split inputs in sync with Date values in form
  const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
  const toTimeInput = (d: Date) => d.toTimeString().slice(0, 5);

  const onStartDate = (v: string) => {
    const [y, m, day] = v.split('-').map(Number);
    const next = new Date(start);
    next.setFullYear(y, m - 1, day);
    setValue('startAt', next, { shouldValidate: true, shouldDirty: true });
  };

  const onStartTime = (v: string) => {
    const [hh, mm] = v.split(':').map(Number);
    const next = new Date(start);
    next.setHours(hh, mm, 0, 0);
    setValue('startAt', next, { shouldValidate: true, shouldDirty: true });
  };

  const onEndDate = (v: string) => {
    const [y, m, day] = v.split('-').map(Number);
    const next = new Date(end);
    next.setFullYear(y, m - 1, day);
    setValue('endAt', next, { shouldValidate: true, shouldDirty: true });
  };

  const onEndTime = (v: string) => {
    const [hh, mm] = v.split(':').map(Number);
    const next = new Date(end);
    next.setHours(hh, mm, 0, 0);
    setValue('endAt', next, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-4">
      {/* Start */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Start date
          </label>
          <input
            type="date"
            value={toDateInput(start)}
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

      {/* End */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            End date
          </label>
          <input
            type="date"
            value={toDateInput(end)}
            onChange={(e) => onEndDate(e.target.value)}
            className="mt-1 w-full rounded-2xl border px-4 py-3
                       border-zinc-300 bg-white text-zinc-900
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-zinc-400
                       dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            End time
          </label>
          <input
            type="time"
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

      {/* Join late */}
      <label className="mt-2 inline-flex cursor-pointer select-none items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          {...register('allowJoinLate')}
          className="sr-only"
        />
        <span className="inline-flex h-5 w-9 items-center rounded-full bg-zinc-200 p-0.5 dark:bg-zinc-800">
          <span
            className="h-4 w-4 rounded-full bg-white translate-x-0 data-[on=true]:translate-x-4 transition-transform"
            data-on={!!watch('allowJoinLate')}
          />
        </span>
        Allow joining after start
      </label>

      {/* TZ hint */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Time zone: {userTzLabel}
      </p>

      {/* Soft collision warning placeholder */}
      <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-3 text-amber-700 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-200">
        Heads up: if you already have overlapping intents today, joining
        elsewhere may auto-close this one.
      </div>
    </div>
  );
}
