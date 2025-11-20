'use client';

import { memo, useCallback, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { FilterSection } from './filter-section';

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

/** Z ISO (UTC) → tekst dla <input type="datetime-local"> w lokalnym czasie */
function isoToLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/** Z wartości z inputa (lokalna) → pełne ISO (UTC) do backendu */
function localInputToISO(val?: string | null): string | null {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Utwórz ISO (UTC) z obiektu Date (liczonego lokalnie) */
function dateToISO(d: Date): string {
  return new Date(d.getTime()).toISOString();
}

type DateRangeSectionProps = {
  startISO: string | null;
  endISO: string | null;
  onStartChange: (iso: string | null) => void;
  onEndChange: (iso: string | null) => void;
};

export const DateRangeSection = memo(function DateRangeSection({
  startISO,
  endISO,
  onStartChange,
  onEndChange,
}: DateRangeSectionProps) {
  const startForInput = useMemo(() => isoToLocalInput(startISO), [startISO]);
  const endForInput = useMemo(() => isoToLocalInput(endISO), [endISO]);
  const endMin = startForInput || undefined;

  const dateError = useMemo(() => {
    if (!startISO || !endISO) return null;
    const s = new Date(startISO).getTime();
    const e = new Date(endISO).getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) return 'Nieprawidłowy format daty.';
    if (e < s)
      return 'Data zakończenia nie może być wcześniejsza niż rozpoczęcia.';
    return null;
  }, [startISO, endISO]);

  const applyPreset = useCallback(
    (preset: 'now1h' | 'tonight' | 'tomorrow' | 'weekend' | '7days') => {
      const now = new Date();
      const start = new Date(now);
      const end = new Date(now);

      switch (preset) {
        case 'now1h': {
          end.setHours(end.getHours() + 1);
          break;
        }
        case 'tonight': {
          const base = new Date(now);
          if (base.getHours() >= 22) base.setDate(base.getDate() + 1);
          base.setHours(18, 0, 0, 0);
          start.setTime(base.getTime());
          const e = new Date(base);
          e.setHours(22, 0, 0, 0);
          end.setTime(e.getTime());
          break;
        }
        case 'tomorrow': {
          const t = new Date(now);
          t.setDate(t.getDate() + 1);
          t.setHours(9, 0, 0, 0);
          start.setTime(t.getTime());
          const e = new Date(t);
          e.setHours(21, 0, 0, 0);
          end.setTime(e.getTime());
          break;
        }
        case 'weekend': {
          const d = new Date(now);
          const day = d.getDay();
          const deltaToSat =
            (6 - day + 7) % 7 || (day === 6 && d.getHours() < 10 ? 0 : 7);
          const sat = new Date(d);
          sat.setDate(d.getDate() + deltaToSat);
          sat.setHours(10, 0, 0, 0);
          const sun = new Date(sat);
          sun.setDate(sat.getDate() + 1);
          sun.setHours(22, 0, 0, 0);
          start.setTime(sat.getTime());
          end.setTime(sun.getTime());
          break;
        }
        case '7days': {
          const s = new Date(now);
          s.setHours(0, 0, 0, 0);
          const e = new Date(s);
          e.setDate(e.getDate() + 7);
          e.setHours(23, 59, 0, 0);
          start.setTime(s.getTime());
          end.setTime(e.getTime());
          break;
        }
      }

      onStartChange(dateToISO(start));
      onEndChange(dateToISO(end));
    },
    [onStartChange, onEndChange]
  );

  return (
    <FilterSection
      title="Zakres dat"
      hint="Skorzystaj z presetów lub ustaw własny zakres."
    >
      {/* Quick Presets */}
      <div className="mb-4">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2.5">Quick Select</p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'now1h', label: 'Now +1h' },
            { id: 'tonight', label: 'Tonight' },
            { id: 'tomorrow', label: 'Tomorrow' },
            { id: 'weekend', label: 'Weekend' },
            { id: '7days', label: 'Next 7 days' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                applyPreset(
                  p.id as 'now1h' | 'tonight' | 'tomorrow' | 'weekend' | '7days'
                )
              }
              className="rounded-xl px-3.5 py-2 text-xs font-medium border transition-all
                         bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300
                         dark:bg-zinc-900/40 dark:text-zinc-300 dark:border-zinc-700/50 dark:hover:bg-zinc-800/60
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Range */}
      <div>
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2.5">Custom Range</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block">
              <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">Start Date & Time</span>
              <div className="flex items-center gap-2 px-4 py-3 text-sm bg-white border rounded-xl border-zinc-200 
                              dark:border-zinc-700 dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-indigo-500/40 transition-shadow">
                <input
                  type="datetime-local"
                  value={startForInput}
                  onChange={(e) => onStartChange(localInputToISO(e.target.value))}
                  className="w-full bg-transparent outline-none text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </label>
          </div>
          <div>
            <label className="block">
              <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">End Date & Time</span>
              <div className="flex items-center gap-2 px-4 py-3 text-sm bg-white border rounded-xl border-zinc-200 
                              dark:border-zinc-700 dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-indigo-500/40 transition-shadow">
                <input
                  type="datetime-local"
                  value={endForInput}
                  min={endMin}
                  onChange={(e) => onEndChange(localInputToISO(e.target.value))}
                  className="w-full bg-transparent outline-none text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      {dateError && (
        <p className="inline-flex items-center gap-2 mt-3 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          {dateError}
        </p>
      )}
    </FilterSection>
  );
});
