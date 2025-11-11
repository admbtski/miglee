/**
 * Virtualized Events Grid using react-virtuoso for better performance with large lists
 *
 * Benefits:
 * - Only renders visible items + overscan
 * - Dramatically reduces DOM nodes for large lists
 * - Smooth scrolling even with 1000+ items
 * - Automatic infinite scroll
 * - Uses window scroll for natural page scrolling
 * - VirtuosoGrid for proper grid layout support
 */

'use client';

import { memo, useCallback, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { EventCard } from '../event-card';
import type { IntentListItem, IntentHoverCallback } from '@/types/intent';
import { mapIntentToEventCardProps } from '@/lib/adapters/intent-adapter';
import { LoadingSkeleton } from './loading-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

type EventsGridVirtualizedProps = {
  items: IntentListItem[];
  isLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  lang: string;
  onLoadMore: () => void;
  onHover?: IntentHoverCallback;
};

export const EventsGridVirtualized = memo(function EventsGridVirtualized({
  items,
  isLoading,
  error,
  hasNextPage,
  isFetchingNextPage,
  lang,
  onLoadMore,
  onHover,
}: EventsGridVirtualizedProps) {
  const showNoResults = !isLoading && !error && items.length === 0;
  const showError = !!error;
  const showSkeletons = isLoading && items.length === 0;
  const showItems = !showSkeletons && items.length > 0;

  // Memoize mapped items to prevent unnecessary recalculations
  const mappedItems = useMemo(
    () =>
      items.map((item, index) =>
        mapIntentToEventCardProps(item, index, lang, onHover)
      ),
    [items, lang, onHover]
  );

  // Group items into rows of 2 for stable rendering (2 columns on desktop, 1 on mobile)
  const itemRows = useMemo(() => {
    const rows: Array<Array<(typeof mappedItems)[number]>> = [];
    for (let i = 0; i < mappedItems.length; i += 2) {
      rows.push(mappedItems.slice(i, i + 2));
    }
    return rows;
  }, [mappedItems]);

  // Load more when reaching end
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // Footer component for loading state
  const Footer = useCallback(() => {
    if (!hasNextPage && items.length > 0) {
      return (
        <div className="py-6 text-center">
          <span className="text-xs opacity-60">
            Wszystko załadowane ({items.length})
          </span>
        </div>
      );
    }
    if (isFetchingNextPage) {
      return (
        <div className="py-6 text-center">
          <span className="text-sm opacity-70">Ładowanie...</span>
        </div>
      );
    }
    return null;
  }, [hasNextPage, isFetchingNextPage, items.length]);

  // Render row of 2 items (1 on mobile, 2 on desktop)
  const renderRow = useCallback(
    (index: number) => {
      const row = itemRows[index];
      if (!row || row.length === 0) return null;

      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {row.map((props) => (
            <EventCard key={props.intentId} {...props} />
          ))}
          {/* Fill empty slot to maintain grid structure on desktop */}
          {row.length < 2 && <div className="invisible hidden md:block" />}
        </div>
      );
    },
    [itemRows]
  );

  // Compute row key for better performance
  const computeRowKey = useCallback(
    (index: number) => {
      const row = itemRows[index];
      return row?.[0]?.intentId || `row-${index}`;
    },
    [itemRows]
  );

  // Components for Virtuoso with spacing between rows
  const virtuosoComponents = useMemo(
    () => ({
      List: ({ children, ...props }: any) => (
        <div {...props} className="flex flex-col gap-6">
          {children}
        </div>
      ),
      Footer,
    }),
    [Footer]
  );

  if (showNoResults) {
    return <EmptyState />;
  }

  if (showError) {
    return <ErrorState message={error?.message} />;
  }

  if (showSkeletons) {
    return (
      <div className="grid grid-cols-1 gap-6 mt-3 md:grid-cols-2">
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  if (showItems) {
    return (
      <div className="mt-3">
        <Virtuoso
          useWindowScroll
          data={itemRows}
          totalCount={itemRows.length}
          endReached={handleEndReached}
          overscan={5}
          itemContent={renderRow}
          computeItemKey={computeRowKey}
          components={virtuosoComponents}
          increaseViewportBy={{ top: 800, bottom: 1600 }}
          defaultItemHeight={450}
        />
      </div>
    );
  }

  return null;
});
