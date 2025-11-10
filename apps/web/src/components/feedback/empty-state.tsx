/**
 * Global empty state component
 */

'use client';

import { memo } from 'react';
import { SearchX, Inbox } from 'lucide-react';

type EmptyStateProps = {
  title?: string;
  message?: string;
  icon?: 'search' | 'inbox';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export const EmptyState = memo(function EmptyState({
  title = 'Brak wyników',
  message = 'Spróbuj zmienić kryteria wyszukiwania',
  icon = 'search',
  action,
  className = '',
}: EmptyStateProps) {
  const Icon = icon === 'search' ? SearchX : Inbox;

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
    >
      <Icon className="w-16 h-16 mb-4 opacity-20" />
      <h3 className="text-sm font-medium opacity-70">{title}</h3>
      {message && <p className="mt-2 text-xs opacity-50">{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-500"
        >
          {action.label}
        </button>
      )}
    </div>
  );
});
