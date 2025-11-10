/**
 * Hybrid Events Grid - Uses virtualization for large lists, regular grid for small lists
 *
 * This provides the best of both worlds:
 * - Small lists (<50 items): Regular grid with animations
 * - Large lists (>=50 items): Virtualized for performance
 */

'use client';

import { memo } from 'react';
import type { IntentListItem, IntentHoverCallback } from '@/types/intent';
import { EventsGrid } from './events-grid';
import { EventsGridVirtualized } from './events-grid-virtualized';

type EventsGridHybridProps = {
  items: IntentListItem[];
  isLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  lang: string;
  onLoadMore: () => void;
  onHover?: IntentHoverCallback;
  virtualizationThreshold?: number;
};

export const EventsGridHybrid = memo(function EventsGridHybrid({
  items,
  isLoading,
  error,
  hasNextPage,
  isFetchingNextPage,
  lang,
  onLoadMore,
  onHover,
  virtualizationThreshold = 50,
}: EventsGridHybridProps) {
  // Use virtualization only for large lists
  const shouldVirtualize = items.length >= virtualizationThreshold;

  if (shouldVirtualize) {
    return (
      <EventsGridVirtualized
        items={items}
        isLoading={isLoading}
        error={error}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        lang={lang}
        onLoadMore={onLoadMore}
        onHover={onHover}
      />
    );
  }

  return (
    <EventsGrid
      items={items}
      isLoading={isLoading}
      error={error}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      lang={lang}
      onLoadMore={onLoadMore}
      onHover={onHover}
    />
  );
});
