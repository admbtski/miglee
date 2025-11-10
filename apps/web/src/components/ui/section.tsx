/**
 * Reusable Section component for grouping form fields
 */

import React from 'react';

export interface SectionProps {
  title: string;
  hint?: string;
  children: React.ReactNode;
}

export function Section({ title, hint, children }: SectionProps) {
  return (
    <div className="p-3 bg-white border rounded-2xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-2 text-sm font-medium">{title}</div>
      {hint && (
        <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}
