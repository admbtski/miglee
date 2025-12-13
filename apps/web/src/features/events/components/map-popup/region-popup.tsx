'use client';
/**
 * Popup container for displaying multiple events in a region with infinity scroll
 */

import { memo, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { PopupItem, PopupEvent } from './popup-item';
import { PopupItemSkeleton } from './popup-item-skeleton';

export interface RegionPopupProps {
  events: PopupEvent[];
  onEventClick?: (id: string) => void;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  locale?: string;
}

export const RegionPopup = memo(function RegionPopup({
  events,
  onEventClick,
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  locale,
}: RegionPopupProps) {
  // Show items if we have any, regardless of loading state
  const showItems = events.length > 0;
  const showSkeletons = !showItems && isLoading;

  // Infinite scroll with IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first &&
          first.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (showSkeletons) {
    return (
      <div
        className={clsx(
          'max-w-[280px] max-h-[420px] font-sans relative',
          'bg-zinc-900/95 backdrop-blur-xl',
          'rounded-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)] ring-1 ring-white/10'
        )}
      >
        <div className="p-4 flex flex-col gap-4">
          <PopupItemSkeleton />
          <PopupItemSkeleton />
          <PopupItemSkeleton />
        </div>
      </div>
    );
  }

  if (showItems) {
    return (
      <div
        className={clsx(
          'w-[280px] h-[420px] font-sans relative',
          'bg-zinc-900/95 backdrop-blur-xl',
          'rounded-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)] ring-1 ring-white/10',
          'overflow-hidden'
        )}
      >
        {/* Subtle top fade for scroll indication */}
        <div className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-10 bg-gradient-to-b from-zinc-900/50 to-transparent" />

        {/* Subtle bottom fade for scroll indication */}
        <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10 bg-gradient-to-t from-zinc-900/50 to-transparent" />

        {/* Scrollable content */}
        <div className="h-[420px] overflow-y-auto overflow-x-hidden">
          <div className="px-4 py-4 flex flex-col">
            {events.map((event) => (
              <PopupItem
                key={event.id}
                event={event}
                onClick={onEventClick}
                locale={locale}
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-px" />

            {/* Footer */}
            {!hasNextPage && events.length > 0 && (
              <div className="py-3 text-center">
                <span className="text-xs text-zinc-500">
                  Wszystko załadowane ({events.length})
                </span>
              </div>
            )}
            {isFetchingNextPage && (
              <div className="px-4 pb-4">
                <PopupItemSkeleton />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'max-w-[280px] font-sans relative',
        'bg-zinc-900/95 backdrop-blur-xl',
        'rounded-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)] ring-1 ring-white/10',
        'p-6'
      )}
    >
      <p className="text-sm text-zinc-400 text-center">
        Brak wydarzeń w tym regionie
      </p>
    </div>
  );
});
