/**
 * Custom hook for reverse infinite scroll (chat-style)
 *
 * @description
 * Implements reverse infinite scrolling pattern commonly used in chat applications:
 * - Starts at bottom (newest messages first)
 * - Loads older messages when scrolling up
 * - Preserves scroll position after loading new content
 * - Supports prefetch for smoother UX
 * - Tracks scroll position and "at bottom" state
 *
 * Features:
 * - Automatic scroll position preservation
 * - Configurable load threshold
 * - Optional prefetch with multiplier
 * - "At bottom" detection
 * - Programmatic scroll to bottom
 *
 * @example
 * ```tsx
 * const { scrollRef, isAtBottom, scrollToBottom, scrollFromBottom } =
 *   useReverseInfiniteScroll({
 *     hasMore: hasNextPage,
 *     isLoading: isFetchingNextPage,
 *     onLoadMore: fetchNextPage,
 *     threshold: 200,
 *     enablePrefetch: true,
 *   });
 *
 * return (
 *   <div ref={scrollRef} className="overflow-auto h-full">
 *     {messages.map(msg => <Message key={msg.id} {...msg} />)}
 *     {!isAtBottom && (
 *       <button onClick={() => scrollToBottom(true)}>
 *         Scroll to bottom
 *       </button>
 *     )}
 *   </div>
 * );
 * ```
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface ReverseInfiniteScrollOptions {
  /** Whether there are more items to load (hasPreviousPage) */
  hasMore: boolean;
  /** Whether currently loading */
  isLoading: boolean;
  /** Callback to load more items */
  onLoadMore: () => void;
  /** Threshold in pixels from top to trigger load (default: 200) */
  threshold?: number;
  /** Enable prefetch when getting close to threshold (default: true) */
  enablePrefetch?: boolean;
  /** Prefetch threshold multiplier (default: 1.5x threshold) */
  prefetchMultiplier?: number;
}

export interface ReverseInfiniteScrollResult {
  /** Ref to attach to scroll container element */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Whether user is currently at bottom (within 50px) */
  isAtBottom: boolean;
  /** Scroll to bottom programmatically (with optional smooth animation) */
  scrollToBottom: (smooth?: boolean) => void;
  /** Current scroll distance from bottom in pixels */
  scrollFromBottom: number;
}

// =============================================================================
// Hook
// =============================================================================

export function useReverseInfiniteScroll(
  options: ReverseInfiniteScrollOptions
): ReverseInfiniteScrollResult {
  const {
    hasMore,
    isLoading,
    onLoadMore,
    threshold = 200,
    enablePrefetch = true,
    prefetchMultiplier = 1.5,
  } = options;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [scrollFromBottom, setScrollFromBottom] = useState(0);
  const lastScrollHeight = useRef<number>(0);
  const prefetchTriggered = useRef(false);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = false) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const distanceFromTop = scrollTop;

    setScrollFromBottom(distanceFromBottom);
    setIsAtBottom(distanceFromBottom < 50);

    // Trigger load more when near top
    if (
      hasMore &&
      !isLoading &&
      distanceFromTop < threshold &&
      distanceFromTop > 0
    ) {
      console.log('[ReverseScroll] Triggering load more at top');
      onLoadMore();
      prefetchTriggered.current = false;
    }

    // Prefetch when getting close
    if (
      enablePrefetch &&
      hasMore &&
      !isLoading &&
      !prefetchTriggered.current &&
      distanceFromTop < threshold * prefetchMultiplier
    ) {
      console.log('[ReverseScroll] Prefetch triggered');
      prefetchTriggered.current = true;
      onLoadMore();
    }
  }, [
    hasMore,
    isLoading,
    onLoadMore,
    threshold,
    enablePrefetch,
    prefetchMultiplier,
  ]);

  // Preserve scroll position after new content is added
  useEffect(() => {
    if (!scrollRef.current || isLoading) return;

    const currentScrollHeight = scrollRef.current.scrollHeight;

    // If scroll height increased, we loaded older messages
    if (currentScrollHeight > lastScrollHeight.current) {
      const heightDiff = currentScrollHeight - lastScrollHeight.current;

      // Preserve scroll position by adjusting scrollTop
      scrollRef.current.scrollTop += heightDiff;

      console.log(
        '[ReverseScroll] Preserved scroll position after load:',
        heightDiff
      );
    }

    lastScrollHeight.current = currentScrollHeight;
  }, [isLoading]);

  // Attach scroll listener
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Initial scroll to bottom
  useEffect(() => {
    if (scrollRef.current && lastScrollHeight.current === 0) {
      scrollToBottom();
      lastScrollHeight.current = scrollRef.current.scrollHeight;
    }
  }, [scrollToBottom]);

  return {
    scrollRef,
    isAtBottom,
    scrollToBottom,
    scrollFromBottom,
  };
}
