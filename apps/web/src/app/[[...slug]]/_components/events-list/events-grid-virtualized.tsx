/**
 * Virtualized Events Grid using react-virtuoso for better performance with large lists
 *
 * Benefits:
 * - Only renders visible items + overscan
 * - Dramatically reduces DOM nodes for large lists
 * - Smooth scrolling even with 1000+ items
 * - Automatic infinite scroll
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

  // Render item with proper grid layout
  const renderItem = useCallback(
    (index: number) => {
      const props = mappedItems[index];
      return (
        <div className="pb-6">
          <EventCard key={props.intentId} {...props} />
        </div>
      );
    },
    [mappedItems]
  );

  // Compute item size for better performance
  const computeItemKey = useCallback(
    (index: number) => mappedItems[index]?.intentId || `item-${index}`,
    [mappedItems]
  );

  if (showNoResults) {
    return <EmptyState />;
  }

  if (showError) {
    return <ErrorState message={error?.message} />;
  }

  if (showSkeletons) {
    return (
      <div className="grid grid-cols-1 gap-6 mt-3 sm:grid-cols-2 xl:grid-cols-3">
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  if (showItems) {
    return (
      <div className="mt-3">
        <Virtuoso
          data={mappedItems}
          endReached={handleEndReached}
          overscan={300}
          itemContent={renderItem}
          computeItemKey={computeItemKey}
          components={{
            Footer,
          }}
          style={{
            height: 'calc(100vh - 200px)',
            minHeight: '400px',
          }}
          className="virtuoso-events-list"
        />
      </div>
    );
  }

  return null;
});
