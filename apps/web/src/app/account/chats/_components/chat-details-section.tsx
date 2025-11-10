/**
 * Section and Row components for chat details
 */

'use client';

import { memo } from 'react';

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

export const Section = memo(function Section({
  title,
  children,
}: SectionProps) {
  return (
    <div className="mb-6">
      <div className="px-1 pb-2 text-xs font-semibold tracking-wide uppercase text-zinc-500">
        {title}
      </div>
      <div className="overflow-hidden border rounded-2xl border-zinc-200 dark:border-zinc-700">
        {children}
      </div>
    </div>
  );
});

type RowProps = {
  icon: React.ReactNode;
  label: string;
};

export const Row = memo(function Row({ icon, label }: RowProps) {
  return (
    <button className="flex items-center w-full gap-3 px-4 py-3 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
      <span className="grid w-8 h-8 border place-items-center rounded-xl border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
});
