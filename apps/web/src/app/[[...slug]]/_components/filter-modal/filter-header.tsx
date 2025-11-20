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
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={onClose}
        className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-zinc-600 border border-zinc-200 
                   hover:bg-zinc-50 hover:border-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 
                   transition-all dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:border-zinc-600"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      <div
        id="filters-title"
        className="flex items-center gap-2.5 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
          <SlidersHorizontal className="w-4 h-4 text-white" />
        </div>
        <span>Search Filters</span>
      </div>
      <button
        onClick={onClear}
        disabled={!isDirty}
        className="px-4 py-2 text-sm font-medium rounded-xl border transition-all
                   disabled:opacity-40 disabled:cursor-not-allowed
                   bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300
                   dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/50 dark:hover:bg-red-950/50
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
        title={isDirty ? 'Clear all filters' : 'No changes to clear'}
      >
        Clear All
      </button>
    </div>
  );
}
