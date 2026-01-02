/**
 * Tracing Utilities
 */

import { trace, SpanStatusCode, context, SpanKind } from '@opentelemetry/api';
import type { Span } from '@opentelemetry/api';

// Lazy initialization
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('api');
  return _tracer;
}

export async function withSpan<T>(name: string, fn: (span: Span) => Promise<T>, attributes?: Record<string, string | number | boolean>): Promise<T> {
  return tracer().startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function withSpanSync<T>(name: string, fn: (span: Span) => T, attributes?: Record<string, string | number | boolean>): T {
  const span = tracer().startSpan(name, { attributes });
  try {
    const result = fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  } finally {
    span.end();
  }
}

export async function withClientSpan<T>(name: string, fn: (span: Span) => Promise<T>, attributes?: Record<string, string | number | boolean>): Promise<T> {
  return tracer().startActiveSpan(name, { kind: SpanKind.CLIENT, attributes }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  return span ? span.spanContext().traceId : undefined;
}

export function getSpanId(): string | undefined {
  const span = trace.getActiveSpan();
  return span ? span.spanContext().spanId : undefined;
}

export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan();
  if (span) span.setAttributes(attributes);
}

export function addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan();
  if (span) span.addEvent(name, attributes);
}

export function setSpanError(error: Error | string): void {
  const span = trace.getActiveSpan();
  if (span) {
    if (error instanceof Error) span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: typeof error === 'string' ? error : error.message });
  }
}

export function tracedResolver<TArgs, TContext, TResult>(
  name: string,
  resolver: (parent: unknown, args: TArgs, context: TContext, info: unknown) => Promise<TResult>
): (parent: unknown, args: TArgs, context: TContext, info: unknown) => Promise<TResult> {
  return async (parent, args, ctx, info) => {
    return withSpan(`resolver.${name}`, async (span) => {
      span.setAttribute('graphql.operation', name);
      return resolver(parent, args, ctx, info);
    });
  };
}

export function tracedService<TArgs extends unknown[], TResult>(
  serviceName: string,
  methodName: string,
  method: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    return withSpan(`service.${serviceName}.${methodName}`, async (span) => {
      span.setAttribute('service.name', serviceName);
      span.setAttribute('service.method', methodName);
      return method(...args);
    });
  };
}

export type { Span };
export { SpanStatusCode, context, trace };
