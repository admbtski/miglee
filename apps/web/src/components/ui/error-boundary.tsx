'use client';

import { Component, type ReactNode } from 'react';
import { getCurrentTraceId, getCurrentSpanId } from '@appname/observability/browser';
import { reportFailedTransition } from '@/lib/observability/route-transitions';

/**
 * Error boundary props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  previousRoute: string | null;
  currentRoute: string | null;
}

/**
 * Error boundary component for catching and handling React errors
 * Prevents entire app crashes and provides graceful error UI
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      previousRoute: null,
      currentRoute: typeof window !== 'undefined' ? window.location.pathname : null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidUpdate(): void {
    // Track route changes
    if (typeof window !== 'undefined') {
      const newRoute = window.location.pathname;
      if (newRoute !== this.state.currentRoute && !this.state.hasError) {
        this.setState({
          previousRoute: this.state.currentRoute,
          currentRoute: newRoute,
        });
      }
    }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Get trace context for correlation
    const traceId = getCurrentTraceId();
    const spanId = getCurrentSpanId();

    // Get current route
    const currentRoute = typeof window !== 'undefined' ? window.location.pathname : 'unknown';

    // Log error to monitoring service with trace context
    console.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      traceId,
      spanId,
      route: currentRoute,
      previousRoute: this.state.previousRoute,
    });

    // Report failed route transition if we have route context
    if (this.state.previousRoute && this.state.currentRoute) {
      reportFailedTransition({
        from_path: this.state.previousRoute,
        to_path: this.state.currentRoute,
        error,
      });
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // TODO: Send to error tracking service (Sentry, etc.) with trace context
    // Example:
    // Sentry.captureException(error, {
    //   contexts: {
    //     trace: { trace_id: traceId, span_id: spanId },
    //     route: { from: previousRoute, to: currentRoute },
    //   },
    // });
  }

  reset = (): void => {
    this.setState({ 
      hasError: false, 
      error: null,
      // Keep route tracking intact after reset
    });
  };

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      // Default error UI
      return (
        <DefaultErrorFallback error={this.state.error} reset={this.reset} />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const traceId = getCurrentTraceId();
  const spanId = getCurrentSpanId();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Something went wrong
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            We're sorry, but something unexpected happened. Please try again.
          </p>
          {traceId && (
            <p className="text-xs text-zinc-500 dark:text-zinc-500 font-mono">
              Trace ID: {traceId}
            </p>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-red-900 dark:text-red-100 mb-2">
              Error Details
            </summary>
            <pre className="text-xs text-red-800 dark:text-red-200 overflow-auto">
              {error.message}
              {'\n\n'}
              {error.stack}
              {traceId && `\n\nTrace ID: ${traceId}`}
              {spanId && `\nSpan ID: ${spanId}`}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium rounded-lg transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
