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
        'cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium border transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
        active
          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-violet-500'
          : 'bg-white text-zinc-700 border-white/20 hover:bg-zinc-50 dark:bg-zinc-900/40 dark:text-zinc-200 dark:border-zinc-700/50 dark:hover:bg-zinc-800/60',
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-1">{children}</span>
    </button>
  );
});
