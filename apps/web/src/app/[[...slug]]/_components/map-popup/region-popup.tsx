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
        <div {...props} className="p-2 flex flex-col gap-2">
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
          'rounded-2xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800'
        )}
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
