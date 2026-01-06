/**
 * Route Transitions Tracker
 *
 * Measures soft navigation (SPA transitions) in Next.js App Router
 *
 * Requirements:
 * - ✅ Detect route changes via usePathname()
 * - ✅ Measure transition duration (start → UI render complete)
 * - ✅ Track success/error via Error Boundaries
 * - ✅ Normalize paths to prevent cardinality explosion
 * - ✅ Send as separate event (not mixed with CWV)
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  getSessionId,
  shouldSample,
  normalizePathToTemplate,
  getRouteGroup,
} from '@appname/observability/web-vitals-utils';

interface RouteTransitionPayload {
  // Event identity
  event_type: 'route_transition';
  session_id: string;

  // Transition data
  from_path: string;
  from_template: string;
  from_group: string;

  to_path: string;
  to_template: string;
  to_group: string;

  duration_ms: number;
  success: boolean;
  reason?: 'normal' | 'error' | 'aborted';

  // Context
  device_type: string;
  timestamp: number;
}

/**
 * Send route transition event
 */
function sendTransition(payload: RouteTransitionPayload): void {
  // Check sampling
  if (!shouldSample()) {
    return;
  }

  const url = '/api/telemetry/web';
  const body = JSON.stringify(payload);

  try {
    // Use fetch for transitions (not sendBeacon - we're not unloading)
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Silently fail
    });
  } catch {
    // Silently fail
  }

  // Dev logging
  if (process.env.NODE_ENV !== 'production') {
    console.log('[route-transition]', {
      from: payload.from_template,
      to: payload.to_template,
      duration: payload.duration_ms,
      success: payload.success,
    });
  }
}

/**
 * Get device type
 */
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Measure render completion via requestAnimationFrame
 * Waits for 2x rAF to ensure UI has painted
 */
function measureRenderCompletion(): Promise<number> {
  return new Promise((resolve) => {
    const start = performance.now();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const end = performance.now();
        resolve(end - start);
      });
    });
  });
}

/**
 * Route Transitions Tracker Component
 *
 * Usage:
 * ```tsx
 * // In root layout:
 * <RouteTransitionsTracker />
 * ```
 */
export function RouteTransitionsTracker() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);
  const transitionStartRef = useRef<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Kill switch
    if (process.env.NEXT_PUBLIC_WEB_VITALS_DISABLED === 'true') {
      return;
    }

    // First mount - no transition to measure
    if (previousPathRef.current === null) {
      previousPathRef.current = pathname;
      return;
    }

    // Check if pathname actually changed
    if (previousPathRef.current === pathname) {
      return;
    }

    const fromPath = previousPathRef.current;
    const toPath = pathname;

    // Start transition measurement
    transitionStartRef.current = performance.now();
    setIsTransitioning(true);

    // Measure render completion
    measureRenderCompletion().then(async (renderTime) => {
      const transitionStart = transitionStartRef.current;
      if (transitionStart === null) return;

      const durationMs = performance.now() - transitionStart;

      // Build payload
      const payload: RouteTransitionPayload = {
        event_type: 'route_transition',
        session_id: getSessionId(),

        from_path: fromPath,
        from_template: normalizePathToTemplate(fromPath),
        from_group: getRouteGroup(fromPath),

        to_path: toPath,
        to_template: normalizePathToTemplate(toPath),
        to_group: getRouteGroup(toPath),

        duration_ms: Math.round(durationMs),
        success: true, // Will be updated by Error Boundary if error occurs
        reason: 'normal',

        device_type: getDeviceType(),
        timestamp: Date.now(),
      };

      // Send transition event
      sendTransition(payload);

      setIsTransitioning(false);
    });

    // Update previous path
    previousPathRef.current = pathname;
  }, [pathname]);

  return null;
}

/**
 * Error Boundary Context for tracking failed transitions
 *
 * TODO: Integrate with Error Boundary to track failed transitions
 * When error boundary catches error during transition:
 * - Send route_transition event with success=false, reason='error'
 */
export interface RouteTransitionError {
  from_path: string;
  to_path: string;
  error: Error;
}

/**
 * Report failed route transition
 * Call this from Error Boundary
 */
export function reportFailedTransition(data: RouteTransitionError): void {
  if (!shouldSample()) return;

  const payload: RouteTransitionPayload = {
    event_type: 'route_transition',
    session_id: getSessionId(),

    from_path: data.from_path,
    from_template: normalizePathToTemplate(data.from_path),
    from_group: getRouteGroup(data.from_path),

    to_path: data.to_path,
    to_template: normalizePathToTemplate(data.to_path),
    to_group: getRouteGroup(data.to_path),

    duration_ms: 0, // Error occurred before completion
    success: false,
    reason: 'error',

    device_type: getDeviceType(),
    timestamp: Date.now(),
  };

  sendTransition(payload);
}
