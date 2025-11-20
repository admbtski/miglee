/**
 * Popup container for displaying multiple intents in a region with infinity scroll
 */

import { memo, useCallback, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import clsx from 'clsx';
import { PopupItem, PopupIntent } from './popup-item';
import { PopupItemSkeleton } from './popup-item-skeleton';
import { Plan } from '@/components/ui/plan-theme';

export interface RegionPopupProps {
  intents: PopupIntent[];
  onIntentClick?: (id: string) => void;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export const RegionPopup = memo(function RegionPopup({
  intents,
  onIntentClick,
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}: RegionPopupProps) {
  // Show items if we have any, regardless of loading state
  const showItems = intents.length > 0;
  const showSkeletons = !showItems && isLoading;

  // Add plan based on index for visual variety
  const itemsWithPlan = useMemo(
    () =>
      intents.map((it, index) => ({
        ...it,
        plan: (function planForIndex(i: number): Plan {
          if (i % 7 === 0) return 'premium';
          if (i % 5 === 0) return 'plus';
          if (i % 3 === 0) return 'basic';
          return 'default';
        })(index),
      })),
    [intents]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && onLoadMore) {
      onLoadMore();
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  const Footer = useCallback(() => {
    if (!hasNextPage && intents.length > 0) {
      return (
        <div className="py-2 text-center">
          <span className="text-[10px] opacity-60">
            Wszystko załadowane ({intents.length})
          </span>
        </div>
      );
    }
    if (isFetchingNextPage) {
      return (
        <div className="p-2">
          <PopupItemSkeleton />
        </div>
      );
    }
    return null;
  }, [hasNextPage, isFetchingNextPage, intents.length]);

  const renderItem = useCallback(
    (index: number) => {
      const intent = itemsWithPlan[index];
      if (!intent) return null;
      return (
        <PopupItem key={intent.id} intent={intent} onClick={onIntentClick} />
      );
    },
    [itemsWithPlan, onIntentClick]
  );

  const computeItemKey = useCallback(
    (index: number) => itemsWithPlan[index]?.id || `item-${index}`,
    [itemsWithPlan]
  );

  const virtuosoComponents = useMemo(
    () => ({
      List: ({ children, ...props }: any) => (
        <div {...props} className="px-3 py-4 flex flex-col">
          {children}
        </div>
      ),
      Footer,
    }),
    [Footer]
  );

  if (showSkeletons) {
    return (
      <div
        className={clsx(
          'max-w-[280px] max-h-[420px] font-sans relative',
          'bg-white dark:bg-zinc-900',
          'rounded-2xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800'
        )}
      >
        <div className="p-2 grid gap-2">
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
          'bg-white dark:bg-zinc-900',
          'rounded-3xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800',
          'overflow-hidden'
        )}
      >
        {/* Subtelna ramka świetlna */}
        <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 pointer-events-none z-20" />

        {/* Header fade overlay - mocniejszy, z większym obszarem */}
        <div
          className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 40%, transparent 100%)',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10 dark:block hidden"
          style={{
            background:
              'linear-gradient(to bottom, rgba(24,24,27,0.95) 0%, rgba(24,24,27,0.8) 40%, transparent 100%)',
          }}
        />

        {/* Footer fade overlay - mocniejszy, z większym obszarem */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10"
          style={{
            background:
              'linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 40%, transparent 100%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10 dark:block hidden"
          style={{
            background:
              'linear-gradient(to top, rgba(24,24,27,0.95) 0%, rgba(24,24,27,0.8) 40%, transparent 100%)',
          }}
        />

        {/* Scrollable content with mask */}
        <div
          className="h-full w-full"
          style={{
            maskImage:
              'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
          }}
        >
          <Virtuoso
            style={{ height: '420px', width: '100%' }}
            data={itemsWithPlan}
            totalCount={itemsWithPlan.length}
            endReached={handleEndReached}
            overscan={5}
            atBottomThreshold={400}
            itemContent={renderItem}
            computeItemKey={computeItemKey}
            components={virtuosoComponents}
            increaseViewportBy={{ top: 200, bottom: 400 }}
            followOutput={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'max-w-[280px] font-sans relative',
        'bg-white dark:bg-zinc-900',
        'rounded-2xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800',
        'p-4'
      )}
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Brak wydarzeń w tym regionie
      </p>
    </div>
  );
});
