/**
 * Virtualized Message List with reverse infinite scroll
 * Uses react-window for efficient rendering of large message lists
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';

interface Message {
  id: string;
  [key: string]: any;
}

interface VirtualizedMessageListProps<T extends Message> {
  /** Array of messages (oldest to newest) */
  messages: T[];
  /** Render function for each message */
  renderMessage: (message: T, index: number) => React.ReactNode;
  /** Whether there are more messages to load */
  hasMore: boolean;
  /** Whether currently loading */
  isLoading: boolean;
  /** Callback to load more messages */
  onLoadMore: () => void;
  /** Height of the container */
  height: number;
  /** Width of the container */
  width: number;
  /** Estimated item height for initial render */
  estimatedItemHeight?: number;
  /** Threshold for loading more (pixels from top) */
  loadMoreThreshold?: number;
}

export function VirtualizedMessageList<T extends Message>({
  messages,
  renderMessage,
  hasMore,
  isLoading,
  onLoadMore,
  height,
  width,
  estimatedItemHeight = 80,
  loadMoreThreshold = 200,
}: VirtualizedMessageListProps<T>) {
  const listRef = useRef<List>(null);

  // Row renderer
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const message = messages[index];
      if (!message) return null;

      return <div style={style}>{renderMessage(message, index)}</div>;
    },
    [messages, renderMessage]
  );

  // Handle scroll
  const handleScroll = useCallback(
    ({ scrollOffset }: { scrollOffset: number }) => {
      // Load more when scrolling near top
      if (
        hasMore &&
        !isLoading &&
        scrollOffset < loadMoreThreshold &&
        scrollOffset > 0
      ) {
        console.log('[VirtualList] Loading more at top, offset:', scrollOffset);
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore, loadMoreThreshold]
  );

  // Scroll to bottom on mount and when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  return (
    <List
      ref={listRef}
      height={height}
      width={width}
      itemCount={messages.length}
      itemSize={estimatedItemHeight}
      onScroll={handleScroll}
      overscanCount={5}
      className="scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent"
    >
      {Row}
    </List>
  );
}
