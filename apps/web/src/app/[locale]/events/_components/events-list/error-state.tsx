'use client';

import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { memo } from 'react';
import Link from 'next/link';
import { useLocalePath } from '@/hooks/use-locale-path';

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export const ErrorState = memo(function ErrorState({
  message,
  onRetry,
}: ErrorStateProps) {
  const { localePath } = useLocalePath();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-6">
        {/* Decorative background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 blur-2xl opacity-50" />

        {/* Icon container */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 shadow-lg border border-red-200 dark:border-red-800/50">
          <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Coś poszło nie tak
      </h3>

      <p className="text-zinc-600 dark:text-zinc-400 max-w-md mb-2">
        {message ?? 'Wystąpił nieoczekiwany błąd podczas ładowania wydarzeń.'}
      </p>

      <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
        Spróbuj odświeżyć stronę lub wróć później.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Spróbuj ponownie
          </button>
        )}

        <Link
          href={localePath('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          Strona główna
        </Link>
      </div>

      {/* Technical details */}
      {message && (
        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 w-full max-w-md">
          <details className="text-left">
            <summary className="text-xs text-zinc-500 dark:text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
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
