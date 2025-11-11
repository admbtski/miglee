/**
 * Custom hook for throttling function calls
 *
 * @description
 * Returns a throttled version of the provided function that will only execute
 * at most once per specified time interval. Useful for rate-limiting expensive
 * operations like scroll handlers, resize handlers, or API calls.
 *
 * Features:
 * - Leading edge execution (calls immediately on first invocation)
 * - Trailing edge execution (calls after interval if invoked during cooldown)
 * - Stable reference across renders
 * - Automatic cleanup
 *
 * @example
 * ```tsx
 * const handleScroll = useThrottled((e: Event) => {
 *   console.log('Scroll position:', window.scrollY);
 *   // This will only run once every 300ms
 * }, 300);
 *
 * useEffect(() => {
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, [handleScroll]);
 *
 * // With custom interval
 * const handleResize = useThrottled(() => {
 *   updateLayout();
 * }, 500);
 * ```
 */

'use client';

import { useMemo, useRef } from 'react';

// =============================================================================
// Hook
// =============================================================================

/**
 * Throttle a function to execute at most once per interval
 *
 * @param fn - Function to throttle
 * @param ms - Throttle interval in milliseconds (default: 300)
 * @returns Throttled function with stable reference
 */
export function useThrottled(fn: (...a: any[]) => void, ms = 300) {
  const fnRef = useRef(fn);
  const tRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  fnRef.current = fn;

  // identyczna referencja między renderami
  return useMemo(
    () =>
      (...args: any[]) => {
        const now = performance.now();
        const remain = ms - (now - lastRef.current);
        if (remain <= 0) {
          lastRef.current = now;
          fnRef.current(...args);
        } else if (tRef.current == null) {
          tRef.current = window.setTimeout(() => {
            tRef.current = null;
            lastRef.current = performance.now();
            fnRef.current(...args);
          }, remain) as unknown as number;
        }
      },
    [ms]
  );
}
