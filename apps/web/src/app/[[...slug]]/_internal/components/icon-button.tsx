'use client';

import * as React from 'react';

type IconComp = React.ComponentType<{ className?: string }>;

export function IconButton({
  icon: Icon,
  label,
  onClick,
  className = '',
}: {
  icon: IconComp;
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`cursor-pointer rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${className}`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
