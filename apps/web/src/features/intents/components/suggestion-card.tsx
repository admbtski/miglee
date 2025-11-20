'use client';

import { motion } from 'framer-motion';

type IntentSuggestion = {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  taken: number;
  max: number;
  distanceKm?: number;
  author: string;
};

export function SuggestionCard({
  s,
  selected,
  onSelect,
}: {
  s: IntentSuggestion;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const dtStart = new Date(s.startAt);
  const dtEnd = new Date(s.endAt);

  const startLabel = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dtStart);
  const endLabel = new Intl.DateTimeFormat(undefined, {
    timeStyle: 'short',
  }).format(dtEnd);

  const fullness = `${s.taken}/${s.max}`;
  const distance = Number.isFinite(s.distanceKm)
    ? `${s.distanceKm?.toFixed(1)} km`
    : '';

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={[
        'w-full text-left rounded-2xl border p-4 transition',
        'border-zinc-200 bg-white hover:bg-zinc-50',
        'dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900',
        selected ? 'ring-2 ring-indigo-500' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold">{s.title}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {distance}
        </div>
      </div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        by {s.author} · {startLabel} – {endLabel}
      </div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Slots: {fullness}
      </div>
    </motion.button>
  );
}
