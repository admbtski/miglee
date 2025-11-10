/**
 * Generic card component for sections with title and optional action
 */

'use client';

import { memo, type ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  actionBtn?: { label: string; href?: string; onClick?: () => void };
  children: ReactNode;
  className?: string;
};

export const SectionCard = memo(function SectionCard({
  title,
  actionBtn,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <section
      className={`
        mb-6 rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-sm
        dark:border-zinc-700 dark:bg-[#171a1f]/80 backdrop-blur-[2px]
        ${className}
      `}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
          {title}
        </h3>
        {actionBtn ? (
          actionBtn.onClick ? (
            <button
              onClick={actionBtn.onClick}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900/60"
            >
              {actionBtn.label}
            </button>
          ) : (
            <a
              href={actionBtn.href || '#'}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900/60"
            >
              {actionBtn.label}
            </a>
          )
        ) : null}
      </div>
      {children}
    </section>
  );
});
