/**
 * Header component for account intents page
 * Includes tabs, filters, and counters
 */

'use client';

import { memo, useCallback } from 'react';
import clsx from 'clsx';
import { SlidersHorizontal } from 'lucide-react';
import { StatusFilter } from './status-filter';
import { KindFilter } from './kind-filter';
import { SortFilter } from './sort-filter';
import type {
  IntentsSortBy,
  IntentStatus,
  MeetingKind,
  SortDir,
} from '@/lib/api/__generated__/react-query-update';

type ViewMode = 'owned' | 'member';

type IntentsHeaderProps = {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;

  // Filters
  status: IntentStatus;
  kinds: MeetingKind[];
  sortBy: IntentsSortBy;
  sortDir: SortDir;
  onStatusChange: (status: IntentStatus) => void;
  onKindsChange: (kinds: MeetingKind[]) => void;
  onSortChange: (sort: { by: IntentsSortBy; dir: SortDir }) => void;

  // State
  anyFilterActive: boolean;
  activeFiltersCount: number;
  onClearFilters: () => void;
  onOpenFilters: () => void;

  // Data
  isLoading: boolean;
  hasError: boolean;
  loadedCount: number;
  total: number;
  isFetching: boolean;
};

export const IntentsHeader = memo(function IntentsHeader({
  mode,
  onModeChange,
  status,
  kinds,
  sortBy,
  sortDir,
  onStatusChange,
  onKindsChange,
  onSortChange,
  anyFilterActive,
  activeFiltersCount,
  onClearFilters,
  onOpenFilters,
  isLoading,
  hasError,
  loadedCount,
  total,
  isFetching,
}: IntentsHeaderProps) {
  const handleSortChange = useCallback(
    (next: { by: IntentsSortBy; dir: SortDir }) => {
      onSortChange(next);
    },
    [onSortChange]
  );

  return (
    <header className="mb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Intents</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage automations and saved flows.
          </p>

          {/* Segmented control (view mode) */}
          <div className="mt-4 inline-flex rounded-lg border border-zinc-200 p-1 text-sm dark:border-zinc-800">
            <button
              type="button"
              onClick={() => onModeChange('owned')}
              className={clsx(
                'rounded-md px-3 py-1.5',
                mode === 'owned'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              )}
              aria-pressed={mode === 'owned'}
            >
              Moje
            </button>
            <button
              type="button"
              onClick={() => onModeChange('member')}
              className={clsx(
                'rounded-md px-3 py-1.5',
                mode === 'member'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              )}
              aria-pressed={mode === 'member'}
            >
              Członek
            </button>
          </div>

          {/* Desktop filters (pills) */}
          <div className="mt-3 hidden flex-wrap items-center gap-2 md:flex">
            <StatusFilter value={status} onChange={onStatusChange} />
            <KindFilter values={kinds} onChange={onKindsChange} />
            <SortFilter
              value={{ by: sortBy, dir: sortDir }}
              onChange={handleSortChange}
            />
            {anyFilterActive && (
              <button
                className="rounded-full px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={onClearFilters}
                title="Wyczyść filtry"
              >
                Wyczyść filtry
              </button>
            )}
          </div>
        </div>

        {/* Mobile: Filters button */}
        <div className="mt-1 md:hidden">
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-sm text-white shadow-sm dark:border-zinc-700"
            aria-haspopup="dialog"
            aria-label="Filtry"
            title="Filtry"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtry
            {activeFiltersCount > 0 && (
              <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-zinc-800 px-2 text-sm">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Counter / loading / refresh indicator */}
      <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        {isLoading ? (
          'Ładowanie…'
        ) : hasError ? (
          'Błąd ładowania'
        ) : (
          <>
            <span className="opacity-70">
              {mode === 'owned' ? 'Twoje intenty' : 'Intenty (Członek)'}:{' '}
              <b>{loadedCount}</b>
              {typeof total === 'number' && total >= loadedCount && (
                <>
                  {' '}
                  / <b>{total}</b>
                </>
              )}
            </span>
            {isFetching && (
              <span className="ml-2 opacity-60">(odświeżanie…)</span>
            )}
          </>
        )}
      </div>
    </header>
  );
});
