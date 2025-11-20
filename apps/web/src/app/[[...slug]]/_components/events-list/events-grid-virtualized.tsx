/**
 * Virtualized Events Grid using react-virtuoso for better performance with large lists
 *
 * Benefits:
 * - Only renders visible items + overscan
 * - Dramatically reduces DOM nodes for large lists
 * - Smooth scrolling even with 1000+ items
 * - Automatic infinite scroll
 * - Uses window scroll for natural page scrolling
 */

'use client';

import { mapIntentToEventCardProps } from '@/lib/adapters/intent-adapter';
import type { IntentHoverCallback, IntentListItem } from '@/types/intent';
import { memo, useCallback, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { EventCard, type EventCardProps } from '../event-card';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingSkeleton } from './loading-skeleton';

const ITEMS_PER_ROW = 2;
const VIRTUOSO_OVERSCAN = 5;
const VIRTUOSO_VIEWPORT_INCREASE = { top: 800, bottom: 1600 };
const DEFAULT_ITEM_HEIGHT = 450;

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

function createItemRows(
  items: IntentListItem[],
  lang: string,
  onHover?: IntentHoverCallback
): EventCardProps[][] {
  const rows: EventCardProps[][] = [];

  for (let i = 0; i < items.length; i += ITEMS_PER_ROW) {
    const row: EventCardProps[] = [];

    for (let j = 0; j < ITEMS_PER_ROW; j++) {
      const item = items[i + j];
      if (item) {
        row.push(mapIntentToEventCardProps(item, i + j, lang, onHover));
      }
    }

    if (row.length > 0) {
      rows.push(row);
    }
  }

  return rows;
}

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
  const showError = Boolean(error);
  const showSkeletons = isLoading && items.length === 0;
  const showItems = !showSkeletons && items.length > 0;

  const itemRows = useMemo(
    () => createItemRows(items, lang, onHover),
    [items, lang, onHover]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

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

  const renderRow = useCallback(
    (index: number) => {
      const row = itemRows[index];
      if (!row || row.length === 0) {
        return null;
      }

      const needsFiller = row.length < ITEMS_PER_ROW;

      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {row.map((props) => (
            <EventCard key={props.intentId} {...props} />
          ))}
          {needsFiller && <div className="invisible hidden md:block" />}
        </div>
      );
    },
    [itemRows]
  );

  const computeRowKey = useCallback(
    (index: number) => {
      const row = itemRows[index];
      return row?.[0]?.intentId ?? `row-${index}`;
    },
    [itemRows]
  );

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
          overscan={VIRTUOSO_OVERSCAN}
          itemContent={renderRow}
          computeItemKey={computeRowKey}
          components={virtuosoComponents}
          increaseViewportBy={VIRTUOSO_VIEWPORT_INCREASE}
          defaultItemHeight={DEFAULT_ITEM_HEIGHT}
        />
      </div>
    );
  }

  return null;
});
