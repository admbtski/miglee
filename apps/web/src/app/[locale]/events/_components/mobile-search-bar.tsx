/**
 * Mobile Search Bar - Compact search bar for mobile devices
 * Contains: readonly search input (opens TopDrawer) + filter button (opens RightDrawer)
 */

'use client';

import { memo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export type MobileSearchBarProps = {
  q: string;
  city: string | null;
  activeFiltersCount: number;
  onOpenSearch: () => void;
  onOpenFilters: () => void;
};

const translations = {
  pl: {
    searchPlaceholder: 'Szukaj wydarzeń...',
    filters: 'Filtry',
  },
  en: {
    searchPlaceholder: 'Search events...',
    filters: 'Filters',
  },
};

export const MobileSearchBar = memo(function MobileSearchBar({
  q,
  city,
  activeFiltersCount,
  onOpenSearch,
  onOpenFilters,
}: MobileSearchBarProps) {
  const t = translations.pl;

  // Build display text
  const displayText = q || city || '';

  return (
    <div className="flex items-center gap-2 flex-1">
      {/* Search Input (readonly, opens TopDrawer) */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex-1 flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-left transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
      >
        <Search className="w-4 h-4 text-zinc-400 shrink-0" />
        <span
          className={`text-sm truncate ${
            displayText
              ? 'text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {displayText || t.searchPlaceholder}
        </span>
      </button>

      {/* Filter Button (opens RightDrawer) */}
      <button
        type="button"
        onClick={onOpenFilters}
        className="relative flex items-center justify-center p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
        aria-label={t.filters}
      >
        <SlidersHorizontal className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        {activeFiltersCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-indigo-600 rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>
    </div>
  );
});

export default MobileSearchBar;
