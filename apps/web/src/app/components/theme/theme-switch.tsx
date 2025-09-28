// components/theme/theme-switch.tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import clsx from 'clsx';

export function ThemeSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={clsx(
        'relative inline-flex h-6 w-11 cursor-pointer select-none items-center rounded-full border transition-colors',
        'ring-1 ring-black/5 dark:ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        checked
          ? 'bg-zinc-800/80 border-zinc-600'
          : 'bg-white/80 border-zinc-300 dark:bg-zinc-800/70 dark:border-zinc-600'
      )}
      aria-label="Przełącz motyw"
      role="switch"
      aria-checked={checked}
      title={checked ? 'Motyw: Ciemny' : 'Motyw: Jasny'}
    >
      <span
        className={clsx(
          'absolute left-1 grid h-4 w-4 place-items-center rounded-full shadow-md transition-transform will-change-transform',
          checked
            ? 'translate-x-5 bg-gradient-to-br from-indigo-500 to-violet-500' // 🌙
            : 'translate-x-0 bg-gradient-to-br from-amber-400 to-orange-500' // ☀️
        )}
      >
        {checked ? (
          <Moon className="h-3 w-3 text-sky-100" />
        ) : (
          <Sun className="h-3 w-3 text-amber-950" />
        )}
      </span>
    </button>
  );
}
