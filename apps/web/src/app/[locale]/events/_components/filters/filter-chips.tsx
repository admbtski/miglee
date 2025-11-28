'use client';

import { memo } from 'react';
import { X } from 'lucide-react';

type Chip = {
  key: string;
  label: string;
  onClear: () => void;
};

type FilterChipsProps = {
  chips: Chip[];
};

export const FilterChips = memo(function FilterChips({
  chips,
}: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="px-4 pt-3">
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={c.onClear}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm border rounded-full border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200"
            title="Usuń filtr"
          >
            <span className="truncate max-w-[14rem]">{c.label}</span>
            <X className="h-3.5 w-3.5 opacity-60" />
          </button>
        ))}
      </div>
    </div>
  );
});
