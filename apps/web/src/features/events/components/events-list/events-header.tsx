'use client';

// TODO i18n: All hardcoded strings need translation keys
// - "Loading…", "Failed to load", "Znaleziono w...", "event/s", "updating…"

import { memo } from 'react';
import { SortByControl } from '@/features/search';
import { ToggleMap } from '../toggle-map';
import { SortKey } from '@/features/search';

type EventsHeaderProps = {
  isLoading: boolean;
  hasError: boolean;
  city: string | null;
  loadedCount: number;
  total: number;
  isFetching: boolean;
  mapVisible: boolean;
  sort: SortKey;
  onToggleMap: () => void;
  onSortChange: (sort: SortKey) => void;
};

export const EventsHeader = memo(function EventsHeader({
  isLoading,
  hasError,
  city,
  loadedCount,
  total,
  isFetching,
  mapVisible,
  sort,
  onToggleMap,
  onSortChange,
}: EventsHeaderProps) {
  let headerLeft = '';
  if (isLoading) headerLeft = 'Loading…';
  if (!isLoading && hasError) headerLeft = 'Failed to load';
  if (!isLoading && !hasError)
    headerLeft = `Znaleziono ${city ? `w ${city}` : ''} — `;

  const pluralSuffix = total !== 1 ? 's' : '';

  return (
    <div className="sticky z-30 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex items-center justify-between py-2 text-sm">
        <div className="opacity-70">
          {headerLeft}
          {!isLoading && !hasError && (
            <>
              <b>{loadedCount}</b> / <b>{total}</b> event{pluralSuffix}
              {isFetching && <span className="ml-2 opacity-60">updating…</span>}
            </>
          )}
        </div>
        <div className="relative inline-flex items-center gap-3">
          <ToggleMap enable={mapVisible} onToggle={onToggleMap} />
          <SortByControl value={sort} onChange={onSortChange} />
        </div>
      </div>
    </div>
  );
});
