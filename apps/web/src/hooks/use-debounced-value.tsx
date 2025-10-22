// hooks/use-debounced-value.ts
'use client';

import { useEffect, useRef, useState } from 'react';

export type EqualityFn<T> = (a: T, b: T) => boolean;

/**
 * Returns a debounced version of `value` that updates after `delay` ms of inactivity.
 * - Optional equality comparator prevents unnecessary updates.
 * - Optional `leading` emits on the first value change immediately, then debounces subsequent changes.
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
