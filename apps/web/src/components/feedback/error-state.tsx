/**
 * Global error state component
 */

'use client';

import { memo } from 'react';
import { AlertCircle } from 'lucide-react';

type ErrorStateProps = {
  message?: string;
  title?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export const ErrorState = memo(function ErrorState({
  message,
  title = 'Error',
  action,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
    >
      <AlertCircle className="w-16 h-16 mb-4 text-red-600 dark:text-red-400 opacity-50" />
      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
        {title}
      </h3>
      {message && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{message}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-500"
        >
          {action.label}
        </button>
      )}
      <p className="mt-2 text-xs opacity-50">Spróbuj odświeżyć stronę</p>
    </div>
  );
});
