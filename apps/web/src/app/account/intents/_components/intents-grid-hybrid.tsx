/**
 * Hybrid grid component - uses virtualization for large lists
 */

'use client';

import { memo } from 'react';
import { IntentsGrid } from './intents-grid';
import { IntentsGridVirtualized } from './intents-grid-virtualized';
import type { IntentsResultCoreFragment_IntentsResult_items_Intent as IntentItem } from '@/lib/api/__generated__/react-query-update';

type IntentsGridHybridProps = {
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
  virtualizationThreshold?: number;
};

export const IntentsGridHybrid = memo(function IntentsGridHybrid({
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
  virtualizationThreshold = 30,
}: IntentsGridHybridProps) {
  // Use virtualization only for large lists
  const shouldVirtualize = items.length >= virtualizationThreshold;

  if (shouldVirtualize) {
    return (
      <IntentsGridVirtualized
        items={items}
        mode={mode}
        onPreview={onPreview}
        onEdit={onEdit}
        onDelete={onDelete}
        onLeave={onLeave}
        onCancel={onCancel}
        onManage={onManage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={onLoadMore}
      />
    );
  }

  return (
    <IntentsGrid
      items={items}
      mode={mode}
      onPreview={onPreview}
      onEdit={onEdit}
      onDelete={onDelete}
      onLeave={onLeave}
      onCancel={onCancel}
      onManage={onManage}
    />
  );
});
