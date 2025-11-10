'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { EventCard } from '../event-card';
import type { IntentListItem, IntentHoverCallback } from '../../_types/intent';
import { mapIntentToEventCardProps } from '../../_lib/adapters/intent-adapter';
import { LoadingSkeleton } from './loading-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadMoreButton } from './load-more-button';

type EventsGridProps = {
  items: IntentListItem[];
  isLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  lang: string;
  onLoadMore: () => void;
  onHover?: IntentHoverCallback;
};

export const EventsGrid = memo(function EventsGrid({
  items,
  isLoading,
  error,
  hasNextPage,
  isFetchingNextPage,
  lang,
  onLoadMore,
  onHover,
}: EventsGridProps) {
  const showNoResults = !isLoading && !error && items.length === 0;
  const showError = !!error;
  const showSkeletons = isLoading && items.length === 0;
  const showItems = !showSkeletons && items.length > 0;
  const canShowLoadMoreContainer = !error && items.length > 0;

  // Memoize mapped items to prevent unnecessary recalculations
  const mappedItems = useMemo(
    () =>
      items.map((item, index) =>
        mapIntentToEventCardProps(item, index, lang, onHover)
      ),
    [items, lang, onHover]
  );

  return (
    <>
      {showNoResults && <EmptyState />}

      {showError && <ErrorState message={error?.message} />}

      <motion.div
        layout="position"
        className="grid grid-cols-1 gap-6 mt-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {showSkeletons && <LoadingSkeleton count={6} />}

        {showItems &&
          mappedItems.map((props) => (
            <EventCard key={props.intentId} {...props} />
          ))}
      </motion.div>

      {canShowLoadMoreContainer && (
        <div className="mt-6 flex justify-center">
          <LoadMoreButton
            canLoadMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
            loadedCount={items.length}
            onLoadMore={onLoadMore}
          />
        </div>
      )}
    </>
  );
});
