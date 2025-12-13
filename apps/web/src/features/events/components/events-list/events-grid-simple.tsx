/**
 * Simple Events Grid with responsive columns and infinite scroll
 *
 * Features:
 * - No virtualization (simpler, more stable)
 * - Responsive grid (1-3 columns based on container width)
 * - Intersection Observer for infinite scroll
 * - Min card width: 320px, Max: 600px
 * - Dynamic heights work perfectly
 */

'use client';

import React, {
  memo,
  useCallback,
  useMemo,
  useEffect,
  useState,
  useRef,
} from 'react';
import type {
  EventHoverCallback,
  EventListItem,
} from '@/features/events/types/event';
import { EventCard, type EventCardProps } from '../event-card';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingSkeleton } from './loading-skeleton';
import { notEmptyString } from '@/features/events/utils/event';

// Constants
const MAX_COLUMNS = 3;
const MIN_CARD_WIDTH = 320;
const CARD_GAP = 24;

// Map event data to card props
export function mapEventToEventCardProps(
  item: EventListItem,
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
    title: item.title ?? '-',
    categories,
    address: item.address ?? undefined,
    avatarKey: item.owner?.avatarKey ?? null,
    avatarBlurhash: item.owner?.avatarBlurhash ?? null,
    organizerName: item.owner?.name ?? item.owner?.email ?? 'Unknown organizer',
    verifiedAt: item.owner?.verifiedAt ?? undefined,
    plan: 'default',
    boostedAt: item.boostedAt ?? null,
    appearance: item.appearance?.config
      ? { card: (item.appearance.config as any)?.card ?? null }
      : null,
    coverKey: item.coverKey ?? null,
    coverBlurhash: item.coverBlurhash ?? null,
    joinedCount: item.joinedCount,
    min: item.min,
    max: item.max,
    canJoin: item.canJoin,
    isFull: item.isFull,
    isOngoing: item.isOngoing,
    isCanceled: item.isCanceled,
    isDeleted: item.isDeleted,
    hasStarted: item.hasStarted,
    joinOpensMinutesBeforeStart: item.joinOpensMinutesBeforeStart ?? null,
    joinCutoffMinutesBeforeStart: item.joinCutoffMinutesBeforeStart ?? null,
    allowJoinLate: item.allowJoinLate ?? true,
    lateJoinCutoffMinutesAfterStart:
      item.lateJoinCutoffMinutesAfterStart ?? null,
    joinManuallyClosed: item.joinManuallyClosed ?? false,
    isHybrid: item.isHybrid,
    isOnline: item.isOnline,
    isOnsite: item.isOnsite,
    addressVisibility: item.addressVisibility,
    isFavourite: item.isFavourite ?? false,
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
  items: EventListItem[];
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
  // Container ref for width measurement
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Calculate responsive columns
  const columns = useMemo(
    () => calculateColumns(containerWidth),
    [containerWidth]
  );

  const gridClasses = useMemo(() => getGridClasses(columns), [columns]);

  // Map items to card props
  const cardProps = useMemo(
    () => items.map((item) => mapEventToEventCardProps(item, lang, onHover)),
    [items, lang, onHover]
  );

  // Measure container width with ResizeObserver (reacts to layout changes)
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    // Initial measurement
    updateWidth();

    // Use ResizeObserver to detect container width changes
    // This works when left panel or map is hidden/shown
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          // contentBoxSize is always an array in the spec
          const size = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0]
            : entry.contentBoxSize;

          if (size && 'inlineSize' in size) {
            setContainerWidth(size.inlineSize);
          } else {
            // Fallback
            updateWidth();
          }
        } else {
          // Fallback for older browsers
          updateWidth();
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: '2400px',
      }
    );

    observer.observe(sentinelRef.current);

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
