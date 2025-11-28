/**
 * Virtualized grid component for displaying account intents
 * Uses react-virtuoso for better performance with large lists
 */

'use client';

import { memo, useCallback, useMemo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { AccountIntentCard } from './account-intent-card';
import { planForIndex } from '@/lib/adapters/plan-utils';
import type { IntentsResultCoreFragment_IntentsResult_items_Intent as IntentItem } from '@/lib/api/__generated__/react-query-update';

type IntentsGridVirtualizedProps = {
  items: IntentItem[];
  mode: 'owned' | 'member';
  onPreview: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onLeave: (id: string) => void;
  onCancel: (id: string) => void;
  onManage: (id: string) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

export const IntentsGridVirtualized = memo(function IntentsGridVirtualized({
  items,
  mode,
  onPreview,
  onEdit,
  onDelete,
  onLeave,
  onCancel,
  onManage,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: IntentsGridVirtualizedProps) {
  // Render item
  const renderItem = useCallback(
    (index: number) => {
      const it = items[index];
      if (!it) return null;

      const CardComponent = AccountIntentCard as any;
      return (
        <CardComponent
          key={it.id}
          id={it.id}
          owned={mode === 'owned'}
          title={it.title}
          description={it.description}
          startAt={it.startAt}
          endAt={it.endAt}
          address={it.address}
          onlineUrl={it.onlineUrl}
          joinedCount={it.joinedCount}
          min={it.min}
          max={it.max}
          isCanceled={it.isCanceled}
          isDeleted={it.isDeleted}
          addressVisibility={it.addressVisibility}
          isFull={it.isFull}
          hasStarted={it.hasStarted}
          withinLock={it.withinLock}
          categories={it.categories?.map((c) => c.slug)}
          tags={it.tags?.map((t) => t.label)}
          levels={it.levels ?? []}
          isOngoing={it.isOngoing}
          isOnline={it.isOnline}
          isOnsite={it.isOnsite}
          isHybrid={it.isHybrid}
          plan={planForIndex(index)}
          joinOpensMinutesBeforeStart={it.joinOpensMinutesBeforeStart}
          joinCutoffMinutesBeforeStart={it.joinCutoffMinutesBeforeStart}
          allowJoinLate={it.allowJoinLate}
          lateJoinCutoffMinutesAfterStart={it.lateJoinCutoffMinutesAfterStart}
          joinManuallyClosed={it.joinManuallyClosed}
          onPreview={onPreview}
          onEdit={onEdit}
          onDelete={onDelete}
          onLeave={onLeave}
          onCancel={onCancel}
          onManage={onManage}
        />
      );
    },
    [items, mode, onPreview, onEdit, onDelete, onLeave, onCancel, onManage]
  );

  // Compute item key
  const computeItemKey = useCallback(
    (index: number) => items[index]?.id || `item-${index}`,
    [items]
  );

  // Load more when reaching end
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // Footer component
  const Footer = useCallback(() => {
    if (!hasNextPage && items.length > 0) {
      return (
        <div className="py-6 text-center col-span-full">
          <span className="text-xs opacity-60">
            Wszystko załadowane ({items.length})
          </span>
        </div>
      );
    }
    if (isFetchingNextPage) {
      return (
        <div className="py-6 text-center col-span-full">
          <span className="text-sm opacity-70">Ładowanie...</span>
        </div>
      );
    }
    return null;
  }, [hasNextPage, isFetchingNextPage, items.length]);

  // Grid components
  const gridComponents = useMemo(
    () => ({
      List: ({ style, children, ...props }: any) => (
        <div
          {...props}
          style={{
            ...style,
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(min(100%, 400px), 1fr))',
            gap: '1rem',
            padding: '0.5rem 0',
          }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {children}
        </div>
      ),
      Item: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      Footer,
    }),
    [Footer]
  );

  return (
    <div className="mt-3">
      <VirtuosoGrid
        data={items}
        endReached={handleEndReached}
        overscan={200}
        itemContent={renderItem}
        computeItemKey={computeItemKey}
        components={gridComponents}
        style={{
          height: 'calc(100vh - 300px)',
          minHeight: '400px',
        }}
        className="virtuoso-account-intents-grid"
      />
    </div>
  );
});
