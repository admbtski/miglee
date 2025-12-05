/**
 * Global error state component
 */

'use client';

import { memo } from 'react';
import { AlertCircle, RefreshCw, Home, ChevronDown } from 'lucide-react';

type ErrorStateProps = {
  message?: string;
  title?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  showTechnicalDetails?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

export const ErrorState = memo(function ErrorState({
  message,
  title = 'Wystąpił błąd',
  action,
  secondaryAction,
  showTechnicalDetails = false,
  className = '',
  size = 'md',
}: ErrorStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      iconWrapper: 'h-14 w-14',
      icon: 'w-6 h-6',
      title: 'text-sm',
      message: 'text-xs',
      button: 'px-4 py-2 text-sm',
    },
    md: {
      container: 'py-12',
      iconWrapper: 'h-20 w-20',
      icon: 'w-8 h-8',
      title: 'text-base',
      message: 'text-sm',
      button: 'px-5 py-2.5 text-sm',
    },
    lg: {
      container: 'py-16',
      iconWrapper: 'h-24 w-24',
      icon: 'w-10 h-10',
      title: 'text-lg',
      message: 'text-base',
      button: 'px-6 py-3 text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${sizes.container} ${className}`}
    >
      {/* Icon with decorative background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 blur-xl opacity-50" />
        <div
          className={`relative flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-red-200 dark:border-red-800/50 ${sizes.iconWrapper}`}
        >
          <AlertCircle
            className={`${sizes.icon} text-red-500 dark:text-red-400`}
          />
        </div>
      </div>

      <h3
        className={`font-semibold text-zinc-900 dark:text-zinc-100 ${sizes.title}`}
      >
        {title}
      </h3>

      <p
        className={`mt-2 text-zinc-600 dark:text-zinc-400 max-w-md ${sizes.message}`}
      >
        {message || 'Coś poszło nie tak. Spróbuj ponownie lub wróć później.'}
      </p>

      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
        Jeśli problem się powtarza, skontaktuj się z pomocą techniczną.
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          {action && (
            <button
              onClick={action.onClick}
              className={`inline-flex items-center gap-2 justify-center font-medium rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-lg transition-colors ${sizes.button}`}
            >
              <RefreshCw className="w-4 h-4" />
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={`inline-flex items-center gap-2 justify-center font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${sizes.button}`}
            >
              <Home className="w-4 h-4" />
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}

      {/* Technical details */}
      {showTechnicalDetails && message && (
        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 w-full max-w-md">
          <details className="text-left group">
            <summary className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
              <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
              Szczegóły techniczne
            </summary>
            <pre className="mt-2 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 overflow-x-auto">
              {message}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
});
