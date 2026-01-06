/**
 * Observability Provider
 * 
 * Integrates all observability components:
 * - Web Vitals (CWV)
 * - Route Transitions
 * - Runtime Error Tracking
 * 
 * Usage in root layout:
 * ```tsx
 * <ObservabilityProvider>
 *   {children}
 * </ObservabilityProvider>
 * ```
 */

'use client';

import { WebVitalsEnhanced } from '@/lib/observability/web-vitals-enhanced';
import { RouteTransitionsTracker } from '@/lib/observability/route-transitions';
import { RuntimeErrorTracker } from '@/lib/observability/runtime-errors';

interface ObservabilityProviderProps {
  children: React.ReactNode;
}

export function ObservabilityProvider({ children }: ObservabilityProviderProps) {
  return (
    <>
      {/* Web Vitals: LCP, CLS, INP, FCP, TTFB */}
      <WebVitalsEnhanced />
      
      {/* Route Transitions: Soft navigation tracking */}
      <RouteTransitionsTracker />
      
      {/* Runtime Errors: JS errors, unhandledrejection */}
      <RuntimeErrorTracker />
      
      {children}
    </>
  );
}

