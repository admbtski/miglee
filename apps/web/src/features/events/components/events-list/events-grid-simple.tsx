/**
 * Optimized Events Grid with responsive columns and infinite scroll
 *
 * Features:
 * - No virtualization (simpler, more stable)
 * - Responsive grid (1-3 columns based on container width)
 * - Intersection Observer for infinite scroll (2400px rootMargin)
 * - ResizeObserver for dynamic column calculation
 * - Min card width: 320px, Max: 600px per card
 * - Dynamic heights work perfectly
 */

'use client';

import { memo, useMemo, useEffect, useState, useRef } from 'react';
import type { EventHoverCallback } from '@/features/events/types/event';
import { EventCard, type EventCardProps } from '../event-card';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingSkeleton } from './loading-skeleton';
import { notEmptyString } from '@/features/events/utils/event';
import type { EventsListingResultFragment_EventsResult_items_Event } from '@/lib/api/__generated__/react-query-update';

// Constants
const MAX_COLUMNS = 3;
const MIN_CARD_WIDTH = 320;
const CARD_GAP = 24;

/**
 * Map optimized EventCardData to EventCard props
 * Only includes fields present in the EventCardData fragment
 */
function mapEventToCardProps(
  item: EventsListingResultFragment_EventsResult_items_Event,
  lang: string,
  onHover?: EventHoverCallback
): EventCardProps {
  const categories = (item.categories ?? [])
    .map((c) => c.names?.[lang] ?? Object.values(c.names ?? {})[0])
    .filter(notEmptyString);

  return {
    eventId: item.id,
    lat: item.lat,
    lng: item.lng,
    radiusKm: item.radiusKm,
    startISO: item.startAt,
    endISO: item.endAt,
    title: item.title,
    categories,
    address: item.address,
    avatarKey: item.owner?.avatarKey,
    avatarBlurhash: item.owner?.avatarBlurhash,
    organizerName: item.owner?.name ?? 'Unknown',
    verifiedAt: item.owner?.verifiedAt,
    boostedAt: item.boostedAt,
    appearance: item.appearance?.config
      ? { card: item.appearance.config?.card ?? null }
      : null,
    coverKey: item.coverKey,
    joinedCount: item.joinedCount,
    min: item.min,
    max: item.max,
    isCanceled: item.isCanceled,
    isDeleted: item.isDeleted,
    joinOpensMinutesBeforeStart: item.joinOpensMinutesBeforeStart,
    joinCutoffMinutesBeforeStart: item.joinCutoffMinutesBeforeStart,
    allowJoinLate: item.allowJoinLate,
    lateJoinCutoffMinutesAfterStart: item.lateJoinCutoffMinutesAfterStart,
    joinManuallyClosed: item.joinManuallyClosed,
    isHybrid: item.isHybrid,
    isOnline: item.isOnline,
    isOnsite: item.isOnsite,
    addressVisibility: item.addressVisibility,
    isFavourite: item.isFavourite,
    onHover,
  };
}

// Calculate how many columns fit in container width
function calculateColumns(containerWidth: number): number {
  if (containerWidth < MIN_CARD_WIDTH + CARD_GAP) return 1;

  const availableWidth = containerWidth + CARD_GAP;
  const possibleCols = Math.floor(availableWidth / (MIN_CARD_WIDTH + CARD_GAP));

  return Math.min(possibleCols, MAX_COLUMNS);
}

// Get Tailwind grid classes for number of columns
function getGridClasses(cols: number): string {
  switch (cols) {
    case 1:
      return 'grid gap-6 grid-cols-1';
    case 2:
      return 'grid gap-6 grid-cols-1 sm:grid-cols-2';
    case 3:
      return 'grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    default:
      return 'grid gap-6 grid-cols-1 sm:grid-cols-2';
  }
}

// Component Props
type EventsGridSimpleProps = {
  items: EventsListingResultFragment_EventsResult_items_Event[];
  isLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  lang: string;
  onLoadMore: () => void;
  onHover?: EventHoverCallback;
};

export const EventsGridSimple = memo(function EventsGridSimple({
  items,
  isLoading,
  error,
  hasNextPage,
  isFetchingNextPage,
  lang,
  onLoadMore,
  onHover,
}: EventsGridSimpleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Calculate responsive columns
  const columns = useMemo(
    () => calculateColumns(containerWidth),
    [containerWidth]
  );

  const gridClasses = useMemo(() => getGridClasses(columns), [columns]);

  // Map items to card props (memoized)
  const cardProps = useMemo(
    () => items.map((item) => mapEventToCardProps(item, lang, onHover)),
    [items, lang, onHover]
  );

  // Measure container width with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    // Initial measurement
    updateWidth();

    // Observe size changes (triggered when left panel or map toggles)
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      if (entry.contentBoxSize) {
        const size = Array.isArray(entry.contentBoxSize)
          ? entry.contentBoxSize[0]
          : entry.contentBoxSize;

        if (size && 'inlineSize' in size) {
          setContainerWidth(size.inlineSize);
        } else {
          updateWidth();
        }
      } else {
        updateWidth();
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '2400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-3">
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorState message={error.message} />;
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    return <EmptyState />;
  }

  // Grid with all items
  return (
    <div ref={containerRef} className="mt-3">
      <div className={gridClasses}>
        {cardProps.map((props) => (
          <EventCard key={props.eventId} {...props} />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      {hasNextPage && <div ref={sentinelRef} className="h-10" />}

      {/* Loading footer */}
      {isFetchingNextPage && (
        <div className="py-6 text-center">
          <span className="text-sm opacity-70">Ładowanie...</span>
        </div>
      )}

      {/* End of list footer */}
      {!hasNextPage && items.length > 0 && (
        <div className="py-6 text-center">
          <span className="text-xs opacity-60">
            Wszystko załadowane ({items.length})
          </span>
        </div>
      )}
    </div>
  );
});
