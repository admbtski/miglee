/**
 * Optimized Events Grid with responsive columns and infinite scroll
 *
 * Features:
 * - CSS Container Queries for responsive columns based on container width
 * - Intersection Observer for infinite scroll (2400px rootMargin)
 * - Cards expand to fill available space (wider cards when space allows)
 * - Breakpoints: 1 col default, 2 cols @[700px], 3 cols @[1100px]
 */

'use client';

import { memo, useMemo, useEffect, useRef } from 'react';
import { EventCard, type EventCardProps } from '../event-card';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingSkeleton } from './loading-skeleton';
import { notEmptyString, type EventHoverCallback } from '@/features/events';
import type { EventsListingResultFragment_EventsResult_items_Event } from '@/lib/api/__generated__/react-query-update';

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

/**
 * Container Query Grid Classes:
 * - Default: 1 column (narrow containers / mobile)
 * - @[700px]: 2 columns (medium containers)
 * - @[1100px]: 3 columns (wide containers)
 *
 * This ensures cards stay wider for longer before splitting into columns
 */
const GRID_CLASSES =
  'grid gap-6 grid-cols-1 @[700px]:grid-cols-2 @[1100px]:grid-cols-3';

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
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Map items to card props (memoized)
  const cardProps = useMemo(
    () => items.map((item) => mapEventToCardProps(item, lang, onHover)),
    [items, lang, onHover]
  );

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

  // Loading state - also use container queries
  if (isLoading && items.length === 0) {
    return (
      <div className="@container mt-3">
        <div className={GRID_CLASSES}>
          <LoadingSkeleton count={6} />
        </div>
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

  // Grid with container queries - cards respond to container width, not viewport
  return (
    <div className="@container mt-3">
      <div className={GRID_CLASSES}>
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
