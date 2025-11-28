'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { HoveredIntentState, IntentHoverCallback } from '@/types/intent';

const HOVER_DEBOUNCE_MS = 100;

/**
 * Provides debounced hover state management for intent cards
 * Prevents excessive re-renders when hovering over cards quickly
 *
 * @returns Tuple of [hoveredIntent state, handleHover callback]
 */
export function useDebouncedHover(): [HoveredIntentState, IntentHoverCallback] {
  const [hoveredIntent, setHoveredIntent] = useState<HoveredIntentState>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleIntentHover = useCallback<IntentHoverCallback>(
    (intentId, lat, lng) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!intentId) {
          setHoveredIntent(null);
        } else {
          setHoveredIntent({
            id: intentId,
            lat: lat ?? null,
            lng: lng ?? null,
          });
        }
      }, HOVER_DEBOUNCE_MS);
    },
    []
  );

  return [hoveredIntent, handleIntentHover];
}
