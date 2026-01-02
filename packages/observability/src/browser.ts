/**
 * Browser/Frontend OpenTelemetry Integration
 *
 * Provides lightweight tracing for frontend applications (Next.js, React, etc.)
 *
 * Features:
 * - Web Vitals instrumentation (LCP, CLS, INP, FCP, TTFB)
 * - Manual span creation for critical user flows
 * - Trace context extraction/injection for API calls
 *
 * Note: This is a minimal setup. For production, consider using @opentelemetry/instrumentation-document-load
 * and @opentelemetry/instrumentation-user-interaction for automatic instrumentation.
 *
 * IMPORTANT: All functions are defensive and won't throw errors if OpenTelemetry is not available.
 * This ensures they work in various contexts (GraphiQL, SSR, browser, etc.)
 */

import {
  trace,
  context,
  propagation,
  SpanStatusCode,
  Span,
  SpanKind,
} from '@opentelemetry/api';

/**
 * Get current trace ID from active span
 * Used for correlating frontend events with backend traces
 */
export function getCurrentTraceId(): string | undefined {
  try {
    const span = trace.getActiveSpan();
    if (!span) return undefined;

    const traceId = span.spanContext().traceId;
    return traceId || undefined;
  } catch (error) {
    // Silently fail if OTel is not available
    return undefined;
  }
}

/**
 * Get current span ID from active span
 */
export function getCurrentSpanId(): string | undefined {
  try {
    const span = trace.getActiveSpan();
    if (!span) return undefined;

    const spanId = span.spanContext().spanId;
    return spanId || undefined;
  } catch (error) {
    // Silently fail if OTel is not available
    return undefined;
  }
}

/**
 * Inject trace context into HTTP headers
 * Use this when making API calls from the browser
 *
 * @example
 * ```ts
 * const headers = injectTraceHeaders({
 *   'Content-Type': 'application/json',
 * });
 *
 * fetch('/api/data', { headers });
 * ```
 */
export function injectTraceHeaders(
  headers: Record<string, string> = {}
): Record<string, string> {
  const carrier = { ...headers };

  try {
    // Only inject if context is available (OTel might not be initialized)
    const activeContext = context.active();
    if (activeContext) {
      propagation.inject(activeContext, carrier);
    }
  } catch (error) {
    // Silently fail if OTel is not available
    // This can happen in non-instrumented environments (e.g., GraphiQL)
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('[Observability] Failed to inject trace headers:', error);
    }
  }

  return carrier;
}

/**
 * Create a manual span for tracking user interactions
 *
 * @example
 * ```ts
 * const span = createBrowserSpan('user.click.submit_form');
 * span.setAttribute('form.id', 'contact-form');
 * // ... perform action
 * span.end();
 * ```
 */
export function createBrowserSpan(name: string): Span {
  const tracer = trace.getTracer('browser');
  return tracer.startSpan(name, {
    kind: SpanKind.CLIENT,
  });
}

/**
 * Wrap an async function with a span
 *
 * @example
 * ```ts
 * await withBrowserSpan('user.submit_form', async (span) => {
 *   span.setAttribute('form.id', formId);
 *   const result = await submitForm(data);
 *   return result;
 * });
 * ```
 */
export async function withBrowserSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = trace.getTracer('browser');
  const span = tracer.startSpan(name, {
    kind: SpanKind.CLIENT,
    attributes,
  });

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Get device type for web vitals attribution
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const win = (globalThis as any).window;
  if (typeof win === 'undefined' || typeof win.innerWidth === 'undefined') {
    return 'desktop';
  }

  const width = win.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Get current route path (for Next.js)
 */
export function getCurrentRoute(): string {
  const win = (globalThis as any).window;
  if (typeof win === 'undefined' || typeof win.location === 'undefined') {
    return 'unknown';
  }
  return win.location.pathname;
}

/**
 * Get connection type for web vitals
 */
export function getConnectionType(): string {
  if (typeof navigator === 'undefined') return 'unknown';

  // Extended Navigator interface for experimental connection API
  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection) return 'unknown';
  return connection.effectiveType || 'unknown';
}
