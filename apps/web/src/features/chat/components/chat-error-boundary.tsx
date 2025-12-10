/**
 * Chat Error Boundary
 * Catches and handles errors in chat components gracefully
 */

// TODO i18n: All error messages need translation keys

'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Fallback title */
  title?: string;
  /** Fallback description */
  description?: string;
  /** Callback when retry is clicked */
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('Chat Error Boundary caught an error:', error, errorInfo);
    // TODO: Send to Sentry or other error tracking
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            {/* TODO i18n */}
            {this.props.title || 'Coś poszło nie tak'}
          </h3>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 max-w-md">
            {/* TODO i18n */}
            {this.props.description ||
              'Wystąpił błąd podczas ładowania czatu. Spróbuj odświeżyć stronę lub skontaktuj się z pomocą techniczną.'}
          </p>

          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {/* TODO i18n */}
            Spróbuj ponownie
          </button>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-left w-full max-w-md">
              <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-700">
                Szczegóły błędu (dev only)
              </summary>
              <pre className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs overflow-auto">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component for easier usage with hooks
 */
interface ChatErrorWrapperProps {
  children: ReactNode;
  onRetry?: () => void;
}

export function ChatErrorWrapper({ children, onRetry }: ChatErrorWrapperProps) {
  return (
    <ChatErrorBoundary
      title="Nie można załadować czatu"
      description="Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę."
      onRetry={onRetry}
    >
      {children}
    </ChatErrorBoundary>
  );
}
