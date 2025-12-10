/**
 * Section and Row components for chat details
 */

// TODO i18n: All strings need translation keys

'use client';

import { memo } from 'react';
import { Loader2 } from 'lucide-react';

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
  /** Optional click handler */
  onClick?: () => void;
  /** Show a toggle switch on the right */
  toggle?: boolean;
  /** Is toggle currently on */
  isOn?: boolean;
  /** Is loading */
  isLoading?: boolean;
  /** Additional content below the label */
  subLabel?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
};

export const Row = memo(function Row({
  icon,
  label,
  onClick,
  toggle,
  isOn,
  isLoading,
  subLabel,
  disabled,
}: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="flex items-center w-full gap-3 px-4 py-3 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <span className="grid w-8 h-8 border place-items-center rounded-xl border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <span className="block">{label}</span>
        {subLabel && (
          <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {subLabel}
          </span>
        )}
      </div>
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
      {toggle && !isLoading && (
        <div
          className={`relative w-10 h-6 rounded-full transition-colors ${
            isOn ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-600'
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              isOn ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </div>
      )}
    </button>
  );
});
