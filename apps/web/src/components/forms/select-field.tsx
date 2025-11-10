/**
 * Select input field with label
 */

'use client';

import { memo } from 'react';

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
};

export const SelectField = memo(function SelectField({
  label,
  value,
  onChange,
  options,
  className = '',
}: SelectFieldProps) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 text-sm bg-white border outline-none appearance-none rounded-2xl border-zinc-200 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900/60"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2 text-zinc-500">
          ▼
        </span>
      </div>
    </label>
  );
});
