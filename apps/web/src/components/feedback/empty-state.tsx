/**
 * Global empty state component
 */

'use client';

import { memo, ReactNode } from 'react';
import { SearchX, Inbox, FolderOpen, FileQuestion } from 'lucide-react';

type EmptyStateProps = {
  title?: string;
  message?: string;
  icon?: 'search' | 'inbox' | 'folder' | 'file' | ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const ICON_MAP = {
  search: SearchX,
  inbox: Inbox,
  folder: FolderOpen,
  file: FileQuestion,
};

export const EmptyState = memo(function EmptyState({
  title = 'Brak wyników',
  message = 'Spróbuj zmienić kryteria wyszukiwania',
  icon = 'search',
  action,
  secondaryAction,
  className = '',
  size = 'md',
}: EmptyStateProps) {
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

  const renderIcon = () => {
    if (typeof icon === 'string' && icon in ICON_MAP) {
      const IconComponent = ICON_MAP[icon as keyof typeof ICON_MAP];
      return (
        <IconComponent
          className={`${sizes.icon} text-zinc-400 dark:text-zinc-500`}
        />
      );
    }
    return icon;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${sizes.container} ${className}`}
    >
      {/* Icon with decorative background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 blur-xl opacity-50" />
        <div
          className={`relative flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 ${sizes.iconWrapper}`}
        >
          {renderIcon()}
        </div>
      </div>

      <h3
        className={`font-semibold text-zinc-900 dark:text-zinc-100 ${sizes.title}`}
      >
        {title}
      </h3>

      {message && (
        <p
          className={`mt-2 text-zinc-600 dark:text-zinc-400 max-w-md ${sizes.message}`}
        >
          {message}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          {action && (
            <button
              onClick={action.onClick}
              className={`inline-flex items-center justify-center font-medium rounded-xl transition-colors ${sizes.button} ${
                action.variant === 'secondary'
                  ? 'border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                  : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-lg'
              }`}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={`inline-flex items-center justify-center font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${sizes.button}`}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
});
