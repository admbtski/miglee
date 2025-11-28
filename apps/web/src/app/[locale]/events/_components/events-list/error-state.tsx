'use client';

import { AlertCircle } from 'lucide-react';
import { memo } from 'react';

type ErrorStateProps = {
  message?: string;
};

export const ErrorState = memo(function ErrorState({
  message,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="w-16 h-16 mb-4 text-red-600 dark:text-red-400 opacity-50" />
      <p className="text-sm text-red-600 dark:text-red-400">
        {message ?? 'Unknown error'}
      </p>
      <p className="mt-2 text-xs opacity-50">Spróbuj odświeżyć stronę</p>
    </div>
  );
});
