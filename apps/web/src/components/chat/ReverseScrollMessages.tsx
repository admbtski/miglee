/**
 * Reverse Scroll Messages Component
 * - Cursor-based infinite scroll
 * - Starts at bottom (newest)
 * - Loads older messages when scrolling up
 * - Preserves scroll position
 * - Virtualized for performance
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useReverseInfiniteScroll } from '@/hooks/use-reverse-infinite-scroll';
import type { GetDmMessagesQuery } from '@/lib/api/__generated__/react-query-update';

type DmMessage = GetDmMessagesQuery['dmMessages']['edges'][number]['node'];

interface ReverseScrollMessagesProps {
  /** Infinite query data from React Query */
  data: any;
  /** Whether currently fetching next page */
  isFetchingNextPage: boolean;
  /** Whether there is a next page (older messages) */
  hasNextPage: boolean;
  /** Fetch next page callback */
  fetchNextPage: () => void;
  /** Render function for each message */
  renderMessage: (message: DmMessage, index: number) => React.ReactNode;
  /** Container height */
  height?: string;
  /** Loading indicator */
  loadingIndicator?: React.ReactNode;
}

export function ReverseScrollMessages({
  data,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  renderMessage,
  height = 'calc(100vh - 200px)',
  loadingIndicator,
}: ReverseScrollMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollHeight = useRef(0);
  const isInitialMount = useRef(true);

  // Flatten all pages into single array (oldest to newest)
  const allMessages = useMemo(() => {
    if (!data?.pages) return [];

    // Pages are loaded newest first, so reverse them
    const reversedPages = [...data.pages].reverse();

    // Flatten edges from all pages
    const messages: DmMessage[] = [];
    for (const page of reversedPages) {
      if (page?.dmMessages?.edges) {
        for (const edge of page.dmMessages.edges) {
          messages.push(edge.node);
        }
      }
    }

    return messages;
  }, [data?.pages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (
      isInitialMount.current &&
      containerRef.current &&
      allMessages.length > 0
    ) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      lastScrollHeight.current = containerRef.current.scrollHeight;
      isInitialMount.current = false;
    }
  }, [allMessages.length]);

  // Preserve scroll position after loading older messages
  useEffect(() => {
    if (!containerRef.current || isFetchingNextPage || isInitialMount.current)
      return;

    const currentScrollHeight = containerRef.current.scrollHeight;

    if (currentScrollHeight > lastScrollHeight.current) {
      const heightDiff = currentScrollHeight - lastScrollHeight.current;
      containerRef.current.scrollTop += heightDiff;

      console.log('[ReverseScroll] Preserved position, diff:', heightDiff);
    }

    lastScrollHeight.current = currentScrollHeight;
  }, [isFetchingNextPage, allMessages.length]);

  // Handle scroll to detect when to load more
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop } = containerRef.current;

    // Load more when scrolling near top (within 200px)
    if (
      hasNextPage &&
      !isFetchingNextPage &&
      scrollTop < 200 &&
      scrollTop > 0
    ) {
      console.log('[ReverseScroll] Loading more at scrollTop:', scrollTop);
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-2"
      style={{ height }}
    >
      {/* Loading indicator at top */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          {loadingIndicator || (
            <div className="text-sm text-neutral-400">
              Loading older messages...
            </div>
          )}
        </div>
      )}

      {/* No more messages indicator */}
      {!hasNextPage && allMessages.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="text-sm text-neutral-400">
            Beginning of conversation
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-2">
        {allMessages.map((message, index) => (
          <div key={message.id}>{renderMessage(message, index)}</div>
        ))}
      </div>

      {/* Empty state */}
      {allMessages.length === 0 && !isFetchingNextPage && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-neutral-400">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Start the conversation!</p>
          </div>
        </div>
      )}
    </div>
  );
}
