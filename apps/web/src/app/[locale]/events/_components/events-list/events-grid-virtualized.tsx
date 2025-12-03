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

import type { IntentHoverCallback, IntentListItem } from '@/types/intent';
import { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { EventCard, type EventCardProps } from '../event-card';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingSkeleton } from './loading-skeleton';
import { notEmptyString } from '@/lib/utils/intents';

/**
 * Maps raw intent data from API to EventCard component props
 *
 * @param item - Raw intent data from API
 * @param onHover - Optional hover callback for map synchronization
 * @returns Formatted props for EventCard component
 */
export function mapIntentToEventCardProps(
  item: IntentListItem,
  lang: string,
  onHover?: IntentHoverCallback
): EventCardProps {
  const categories = (item.categories ?? [])
    .map((c) => c.names?.[lang] ?? Object.values(c.names ?? {})[0])
    .filter(notEmptyString);

  return {
    // Core identification
    intentId: item.id,
    lat: item.lat,
    lng: item.lng,
    radiusKm: item.radiusKm,

    // Event details
    startISO: item.startAt,
    endISO: item.endAt,
    title: item.title ?? '-',
    categories,
    address: item.address ?? undefined,

    // Organizer info
    avatarKey: item.owner?.avatarKey ?? null,
    avatarBlurhash: item.owner?.avatarBlurhash ?? null,
    organizerName: item.owner?.name ?? item.owner?.email ?? 'Unknown organizer',
    verifiedAt: item.owner?.verifiedAt ?? undefined,
    plan: 'default', // TODO: Will be customizable per event in the future
    boostedAt: item.boostedAt ?? null, // Real boost timestamp from backend
    // Extract card appearance from IntentAppearance.config
    appearance: item.appearance?.config
      ? {
          card: (item.appearance.config as any)?.card ?? null,
        }
      : null,

    // Cover image
    coverKey: item.coverKey ?? null,
    coverBlurhash: item.coverBlurhash ?? null,

    // Capacity & joining
    joinedCount: item.joinedCount,
    min: item.min,
    max: item.max,
    canJoin: item.canJoin,
    isFull: item.isFull,

    // Event state
    isOngoing: item.isOngoing,
    isCanceled: item.isCanceled,
    isDeleted: item.isDeleted,
    hasStarted: item.hasStarted,

    // Join window settings
    joinOpensMinutesBeforeStart: item.joinOpensMinutesBeforeStart ?? null,
    joinCutoffMinutesBeforeStart: item.joinCutoffMinutesBeforeStart ?? null,
    allowJoinLate: item.allowJoinLate ?? true,
    lateJoinCutoffMinutesAfterStart:
      item.lateJoinCutoffMinutesAfterStart ?? null,
    joinManuallyClosed: item.joinManuallyClosed ?? false,

    // Location type
    isHybrid: item.isHybrid,
    isOnline: item.isOnline,
    isOnsite: item.isOnsite,
    addressVisibility: item.addressVisibility,

    // UI options
    isFavourite: item.isFavourite ?? false,

    // Callbacks
    onHover,
  };
}

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
        row.push(mapIntentToEventCardProps(item, lang, onHover));
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

  // Use ref to store the latest onHover callback without triggering re-renders
  const onHoverRef = useRef(onHover);

  useEffect(() => {
    onHoverRef.current = onHover;
  }, [onHover]);

  const itemRows = useMemo(
    () => createItemRows(items, lang, onHoverRef.current),
    [items, lang]
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
