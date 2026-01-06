/**
 * Enhanced Web Vitals Component
 * 
 * Requirements:
 * - ✅ Session ID (anonymous, rotated)
 * - ✅ Sampling control (dev: 100%, prod: configurable)
 * - ✅ Kill switch (ENV variable)
 * - ✅ Route template normalization
 * - ✅ Navigation type detection
 * - ✅ sendBeacon + fetch fallback
 * - ✅ No PII (no query strings, no user IDs)
 * - ✅ Resilient to adblock/offline
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import {
  getSessionId,
  shouldSample,
  normalizePathToTemplate,
  getRouteGroup,
  getNavigationType,
} from '@appname/observability/web-vitals-utils';

interface WebVitalsPayload {
  // Event identity
  event_type: 'web_vital';
  session_id: string;
  
  // Metric data
  metric_name: string;
  metric_value: number;
  metric_id: string;
  metric_rating: 'good' | 'needs-improvement' | 'poor' | undefined;
  metric_delta: number;
  
  // Route context
  pathname: string;
  route_template: string;
  route_group: string;
  navigation_type: string;
  
  // Device/environment context
  device_type: 'mobile' | 'tablet' | 'desktop';
  connection_type: string;
  viewport_width: number;
  viewport_height: number;
  
  // Timing
  timestamp: number;
}

/**
 * Send Web Vital event with enhanced context
 */
function sendWebVital(metric: Metric, pathname: string): void {
  // Check sampling
  if (!shouldSample()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[web-vitals] Skipped (sampling):', metric.name);
    }
    return;
  }

  const payload: WebVitalsPayload = {
    event_type: 'web_vital',
    session_id: getSessionId(),
    
    // Metric data
    metric_name: metric.name,
    metric_value: metric.value,
    metric_id: metric.id,
    metric_rating: metric.rating,
    metric_delta: metric.delta,
    
    // Route context (normalized to prevent PII)
    pathname: pathname, // Current path (no query string)
    route_template: normalizePathToTemplate(pathname),
    route_group: getRouteGroup(pathname),
    navigation_type: metric.navigationType || getNavigationType(),
    
    // Device context
    device_type: getDeviceType(),
    connection_type: getConnectionType(),
    viewport_width: typeof window !== 'undefined' ? window.innerWidth : 0,
    viewport_height: typeof window !== 'undefined' ? window.innerHeight : 0,
    
    // Timestamp
    timestamp: Date.now(),
  };

  // Send via sendBeacon (preferred) or fetch
  sendEvent(payload);

  // Dev logging
  if (process.env.NODE_ENV !== 'production') {
    console.log('[web-vitals]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      route_template: payload.route_template,
      session_id: payload.session_id,
    });
  }
}

/**
 * Send event to backend
 * Resilient to failures (best-effort)
 */
function sendEvent(payload: any): void {
  const url = '/api/telemetry/web';
  const body = JSON.stringify(payload);

  try {
    // Try sendBeacon first (most reliable for page unload)
    if ('sendBeacon' in navigator && navigator.sendBeacon) {
      const sent = navigator.sendBeacon(url, body);
      if (sent) return;
    }

    // Fallback to fetch with keepalive
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Silently fail - telemetry should never break app
    });
  } catch {
    // Silently fail - adblock, offline, etc.
  }
}

/**
 * Get device type based on viewport
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Get connection type
 */
function getConnectionType(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (!connection) return 'unknown';
  return connection.effectiveType || 'unknown';
}

/**
 * Enhanced Web Vitals Component
 * 
 * Usage:
 * ```tsx
 * // In root layout or _app:
 * <WebVitalsEnhanced />
 * ```
 */
export function WebVitalsEnhanced() {
  const pathname = usePathname();

  useEffect(() => {
    // Kill switch check
    if (process.env.NEXT_PUBLIC_WEB_VITALS_DISABLED === 'true') {
      return;
    }

    // Register Web Vitals observers
    // Note: These fire when metrics are available, not on route change
    const send = (metric: Metric) => sendWebVital(metric, pathname);

    onCLS(send);
    onLCP(send);
    onINP(send);
    onFCP(send);
    onTTFB(send);

    // Cleanup not needed - web-vitals handles it
  }, [pathname]); // Re-subscribe when pathname changes to capture current route

  return null;
}

