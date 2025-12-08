'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  HoveredEventState,
  EventHoverCallback,
} from '@/features/events/types/event';

const HOVER_DEBOUNCE_MS = 100;

/**
 * Provides debounced hover state management for event cards
 * Prevents excessive re-renders when hovering over cards quickly
 *
 * @returns Tuple of [hoveredEvent state, handleHover callback]
 */
export function useDebouncedHover(): [HoveredEventState, EventHoverCallback] {
  const [hoveredEvent, setHoveredEvent] = useState<HoveredEventState>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleEventHover = useCallback<EventHoverCallback>(
    (eventId, lat, lng) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!eventId) {
          setHoveredEvent(null);
        } else {
          setHoveredEvent({
            id: eventId,
            lat: lat ?? null,
            lng: lng ?? null,
          });
        }
      }, HOVER_DEBOUNCE_MS);
    },
    []
  );

  return [hoveredEvent, handleEventHover];
}
