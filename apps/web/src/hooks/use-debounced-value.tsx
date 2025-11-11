/**
 * Custom hook for debouncing values
 *
 * @description
 * Returns a debounced version of the input value that only updates after
 * a specified delay of inactivity. Useful for search inputs, form validation,
 * or any scenario where you want to reduce the frequency of updates.
 *
 * Features:
 * - Trailing debounce (updates after delay)
 * - Optional leading debounce (immediate first update)
 * - Custom equality comparator
 * - Automatic cleanup
 *
 * @example
 * ```tsx
 * // Basic usage
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebouncedValue(searchQuery, 300);
 *
 * useEffect(() => {
 *   // This only runs 300ms after user stops typing
 *   fetchResults(debouncedQuery);
 * }, [debouncedQuery]);
 *
 * // With leading option
 * const debouncedValue = useDebouncedValue(value, 500, { leading: true });
 *
 * // With custom equality
 * const debouncedObj = useDebouncedValue(obj, 300, {
 *   equals: (a, b) => a.id === b.id,
 * });
 * ```
 */

'use client';

import { useEffect, useRef, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export type EqualityFn<T> = (a: T, b: T) => boolean;

// =============================================================================
// Hook
// =============================================================================

/**
 * Debounce a value with optional leading emission and custom equality
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @param options - Optional configuration
 * @param options.equals - Custom equality comparator
 * @param options.leading - Emit immediately on first change, then debounce
 * @returns Debounced value
 */
export function useDebouncedValue<T>(
  value: T,
  delay = 300,
  options?: {
    equals?: EqualityFn<T>;
    leading?: boolean;
  }
): T {
  const { equals, leading = false } = options || {};
  const [debounced, setDebounced] = useState<T>(value);
  const firstRef = useRef(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Leading emission only once per "burst"
    if (
      leading &&
      (firstRef.current ||
        (equals ? !equals(value, debounced) : value !== debounced))
    ) {
      firstRef.current = false;
      setDebounced(value);
      // schedule the next updates to be debounced
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        firstRef.current = true;
      }, delay);
      return;
    }

    // Standard trailing debounce
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (equals ? !equals(value, debounced) : value !== debounced) {
        setDebounced(value);
      }
      firstRef.current = true;
    }, delay);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay, leading, equals]);

  return debounced;
}
