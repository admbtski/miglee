/**
 * Header component for filter modal
 */

import { SlidersHorizontal, X } from 'lucide-react';

export interface FilterHeaderProps {
  onClose: () => void;
  onClear: () => void;
  isDirty: boolean;
}

export function FilterHeader({ onClose, onClear, isDirty }: FilterHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-3xl bg-white/85 backdrop-blur dark:bg-zinc-900/85">
      <button
        onClick={onClose}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-zinc-600 ring-1 ring-transparent hover:bg-zinc-100 focus:outline-none focus:ring-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
      <div
        id="filters-title"
        className="flex items-center gap-2 text-base font-medium"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filtry wyszukiwania
      </div>
      <button
        onClick={onClear}
        disabled={!isDirty}
        className="px-3 py-1 text-sm font-medium rounded-full ring-1 disabled:opacity-40 disabled:cursor-not-allowed
                bg-red-500/10 text-red-600 ring-red-100 hover:bg-red-500/15 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20"
        title={isDirty ? 'Wyczyść wszystkie' : 'Brak zmian do wyczyszczenia'}
      >
        Wyczyść
      </button>
    </div>
  );
}
