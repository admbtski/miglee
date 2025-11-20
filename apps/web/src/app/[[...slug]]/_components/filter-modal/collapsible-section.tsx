/**
 * Collapsible Section Component for Filter Modal
 */

'use client';

import { ChevronDown } from 'lucide-react';
import { ReactNode } from 'react';

type CollapsibleSectionProps = {
  title: string;
  description: string;
  icon: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  activeCount?: number;
  divider?: boolean;
};

export function CollapsibleSection({
  title,
  description,
  icon,
  isExpanded,
  onToggle,
  children,
  activeCount,
  divider,
}: CollapsibleSectionProps) {
  return (
    <div className="pt-6">
      {/* Divider */}
      {divider && (
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800 mb-6" />
      )}

      {/* Header - clickable to toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-3 text-left group hover:opacity-80 transition-opacity cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex-1">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
            <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
            <span>{title}</span>
            {activeCount !== undefined && activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-indigo-600 text-white dark:bg-indigo-500">
                {activeCount}
              </span>
            )}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
        <div
          className={`mt-1 transition-transform duration-300 ease-out text-zinc-400 dark:text-zinc-500 ${
            isExpanded ? 'rotate-180' : 'rotate-0'
          }`}
        >
          <ChevronDown className="h-5 w-5" />
        </div>
      </button>

      {/* Collapsible Content with smooth animation */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'grid-rows-[1fr] opacity-100 mt-6'
            : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
