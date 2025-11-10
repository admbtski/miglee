/**
 * Text input field with label and optional help text
 */

'use client';

import { memo } from 'react';

type TextFieldProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  help?: string;
  className?: string;
};

export const TextField = memo(function TextField({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  help,
  className = '',
}: TextFieldProps) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full px-4 py-3 text-sm bg-white border outline-none rounded-2xl border-zinc-200 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900/60"
      />
      {help && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{help}</p>
      )}
    </label>
  );
});
