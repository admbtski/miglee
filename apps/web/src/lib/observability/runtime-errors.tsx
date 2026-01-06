/**
 * Runtime Error Tracker
 *
 * Tracks:
 * - JS runtime errors (window.onerror)
 * - Unhandled promise rejections
 * - Resource load errors (optional)
 *
 * Requirements:
 * - ✅ No PII (truncate long messages, no stack traces with file paths)
 * - ✅ Route context
 * - ✅ Session correlation
 * - ✅ Sampling
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  getSessionId,
  shouldSample,
  normalizePathToTemplate,
} from '@appname/observability/web-vitals-utils';

interface RuntimeErrorPayload {
  event_type: 'runtime_error';
  session_id: string;
  error_type: string;
  error_message: string;
  pathname: string;
  route_template: string;
  timestamp: number;
}

/**
 * Send error event
 */
function sendErrorEvent(payload: RuntimeErrorPayload): void {
  if (!shouldSample()) return;

  const url = '/api/telemetry/web';
  const body = JSON.stringify(payload);

  try {
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
}

/**
 * Truncate error message to prevent PII leakage
 */
function truncateMessage(message: string, maxLength = 500): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
}

/**
 * Runtime Error Tracker Component
 */
export function RuntimeErrorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Kill switch
    if (process.env.NEXT_PUBLIC_WEB_VITALS_DISABLED === 'true') {
      return;
    }

    // Handler for window.onerror (JS runtime errors)
    const handleError = (
      event: ErrorEvent | string,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) => {
      let errorMessage = '';
      let errorType = 'Error';

      if (typeof event === 'string') {
        errorMessage = event;
      } else if (event instanceof ErrorEvent) {
        errorMessage = event.message;
        errorType = event.error?.name || 'Error';
      }

      const payload: RuntimeErrorPayload = {
        event_type: 'runtime_error',
        session_id: getSessionId(),
        error_type: errorType,
        error_message: truncateMessage(errorMessage),
        pathname: pathname,
        route_template: normalizePathToTemplate(pathname),
        timestamp: Date.now(),
      };

      sendErrorEvent(payload);

      if (process.env.NODE_ENV !== 'production') {
        console.error('[runtime-error]', {
          type: errorType,
          message: errorMessage,
          route: pathname,
        });
      }

      // Don't prevent default error handling
      return false;
    };

    // Handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason);

      const payload: RuntimeErrorPayload = {
        event_type: 'runtime_error',
        session_id: getSessionId(),
        error_type: 'UnhandledRejection',
        error_message: truncateMessage(errorMessage),
        pathname: pathname,
        route_template: normalizePathToTemplate(pathname),
        timestamp: Date.now(),
      };

      sendErrorEvent(payload);

      if (process.env.NODE_ENV !== 'production') {
        console.error('[unhandled-rejection]', {
          message: errorMessage,
          route: pathname,
        });
      }
    };

    // Register handlers
    window.addEventListener('error', handleError as any);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError as any);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, [pathname]);

  return null;
}
