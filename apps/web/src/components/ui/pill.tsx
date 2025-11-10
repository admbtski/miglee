/**
 * Reusable Pill button component for filters
 */

import React from 'react';

export interface PillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}

export const Pill = React.memo(function Pill({
  active,
  onClick,
  children,
  title,
}: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        'cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 transition',
        active
          ? 'bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white'
          : 'bg-zinc-50 text-zinc-700 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:text-zinc-200 dark:ring-zinc-700',
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-1">{children}</span>
    </button>
  );
});
