/**
 * Simple virtualization hook for chat messages
 * Renders only visible items based on scroll position
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVirtualizedListOptions {
  /** Total number of items */
  itemCount: number;
  /** Estimated height of each item in pixels */
  estimatedItemHeight: number;
  /** Number of items to render outside viewport (overscan) */
  overscanCount?: number;
  /** Container ref */
  containerRef: React.RefObject<HTMLElement>;
}

interface VirtualizedListResult {
  /** Start index of visible range */
  startIndex: number;
  /** End index of visible range */
  endIndex: number;
  /** Total height of all items (for scroll container) */
  totalHeight: number;
  /** Offset from top for visible items */
  offsetTop: number;
}

export function useVirtualizedList({
  itemCount,
  estimatedItemHeight,
  overscanCount = 5,
  containerRef,
}: UseVirtualizedListOptions): VirtualizedListResult {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    // Calculate which items should be visible
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / estimatedItemHeight) - overscanCount
    );
    const endIndex = Math.min(
      itemCount,
      Math.ceil((scrollTop + containerHeight) / estimatedItemHeight) +
        overscanCount
    );

    setVisibleRange({ start: startIndex, end: endIndex });
  }, [itemCount, estimatedItemHeight, overscanCount, containerRef]);

  // Update on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateVisibleRange();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [updateVisibleRange, containerRef]);

  // Update on mount and when itemCount changes
  useEffect(() => {
    updateVisibleRange();
  }, [updateVisibleRange]);

  const totalHeight = itemCount * estimatedItemHeight;
  const offsetTop = visibleRange.start * estimatedItemHeight;

  return {
    startIndex: visibleRange.start,
    endIndex: visibleRange.end,
    totalHeight,
    offsetTop,
  };
}
