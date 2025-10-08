'use client';

import { motion } from 'framer-motion';
import { IntentSuggestion } from '../../types';

export function SuggestionCard({
  s,
  selected,
  onSelect,
}: {
  s: IntentSuggestion;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const fullness = `${s.taken}/${s.max}`;
  const time = `${new Date(s.startAt).toLocaleString()} – ${new Date(s.endAt).toLocaleTimeString()}`;

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
          {s.distanceKm.toFixed(1)} km
        </div>
      </div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        by {s.author} · {time}
      </div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Slots: {fullness}
      </div>
    </motion.button>
  );
}
