/**
 * Custom hook for simple list virtualization
 *
 * @description
 * Provides basic virtualization for long lists by rendering only visible items.
 * Calculates which items should be rendered based on scroll position and viewport size.
 * Includes overscan to prevent flickering during fast scrolling.
 *
 * Features:
 * - Renders only visible items + overscan
 * - Automatic scroll position tracking
 * - Configurable overscan count
 * - Performance optimized with useCallback
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { startIndex, endIndex, totalHeight, offsetTop } = useVirtualizedList({
 *   itemCount: 1000,
 *   estimatedItemHeight: 60,
 *   overscanCount: 5,
 *   containerRef,
 * });
 *
 * return (
 *   <div ref={containerRef} style={{ height: '400px', overflow: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       <div style={{ transform: `translateY(${offsetTop}px)` }}>
 *         {items.slice(startIndex, endIndex).map(item => (
 *           <Item key={item.id} {...item} />
 *         ))}
 *       </div>
 *     </div>
 *   </div>
 * );
 * ```
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

interface UseVirtualizedListOptions {
  /** Total number of items in the list */
  itemCount: number;
  /** Estimated height of each item in pixels */
  estimatedItemHeight: number;
  /** Number of items to render outside viewport (overscan) for smooth scrolling */
  overscanCount?: number;
  /** Ref to the scroll container element */
  containerRef: React.RefObject<HTMLElement>;
}

interface VirtualizedListResult {
  /** Start index of visible range (including overscan) */
  startIndex: number;
  /** End index of visible range (including overscan) */
  endIndex: number;
  /** Total height of all items (for scroll container sizing) */
  totalHeight: number;
  /** Offset from top for visible items (for positioning) */
  offsetTop: number;
}

// =============================================================================
// Hook
// =============================================================================

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
