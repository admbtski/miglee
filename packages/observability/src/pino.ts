/**
 * Pino + OpenTelemetry Integration
 *
 * Enhances Pino logger with trace context (trace_id, span_id)
 * for log-trace correlation in Grafana.
 */

import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import type { Logger } from 'pino';

/**
 * Create a Pino mixin that adds trace context to every log
 *
 * Usage:
 * ```ts
 * import pino from 'pino';
 * import { pinoTraceMixin } from '@appname/observability/pino';
 *
 * const logger = pino({
 *   mixin: pinoTraceMixin,
 *   // ... other options
 * });
 * ```
 */
export function pinoTraceMixin(): Record<string, string | undefined> {
  const span = trace.getSpan(context.active());
  
  if (!span) {
    return {};
  }
  
  const spanContext = span.spanContext();
  
  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
    trace_flags: `0${spanContext.traceFlags.toString(16)}`,
  };
}

/**
 * Wrap Pino logger to record exceptions in active span
 *
 * Usage:
 * ```ts
 * const logger = wrapLoggerWithTracing(pinoLogger);
 * logger.error({ err }, 'Something went wrong'); // Also records in span
 * ```
 */
export function wrapLoggerWithTracing<T extends Logger>(logger: T): T {
  const originalError = logger.error.bind(logger);
  const originalFatal = logger.fatal.bind(logger);
  
  // Wrap error() to record exception in span
  (logger as Logger).error = function (this: Logger, ...args: Parameters<Logger['error']>) {
    const span = trace.getSpan(context.active());
    
    if (span) {
      // Extract error object from various pino signatures
      let error: Error | undefined;
      const firstArg = args[0];
      
      if (firstArg instanceof Error) {
        error = firstArg;
      } else if (typeof firstArg === 'object' && firstArg !== null && 'err' in firstArg) {
        error = (firstArg as { err: unknown }).err as Error;
      }
      
      if (error) {
        // Record exception in span
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      }
    }
    
    return originalError(...args);
  } as Logger['error'];
  
  // Wrap fatal() similarly
  (logger as Logger).fatal = function (this: Logger, ...args: Parameters<Logger['fatal']>) {
    const span = trace.getSpan(context.active());
    
    if (span) {
      let error: Error | undefined;
      const firstArg = args[0];
      
      if (firstArg instanceof Error) {
        error = firstArg;
      } else if (typeof firstArg === 'object' && firstArg !== null && 'err' in firstArg) {
        error = (firstArg as { err: unknown }).err as Error;
      }
      
      if (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      }
    }
    
    return originalFatal(...args);
  } as Logger['fatal'];
  
  return logger;
}

/**
 * Helper to create child logger with span context
 *
 * Useful for passing logger to functions that don't have access to OTel context
 */
export function childLoggerWithSpan(logger: Logger): Logger {
  const traceContext = pinoTraceMixin();
  return logger.child(traceContext);
}

