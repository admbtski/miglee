'use client';

import clsx from 'clsx';
import { Map as MapIcon } from 'lucide-react';
import { KeyboardEvent } from 'react';

export function MapToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? 'Hide map' : 'Show map'}
      title={enabled ? 'Hide map' : 'Show map'}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      className={clsx(
        'group relative inline-flex h-7 w-12 cursor-pointer select-none items-center rounded-full border',
        'transition-[background,border-color,box-shadow] duration-200 ease-out',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/40',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
        enabled
          ? 'bg-indigo-600 border-indigo-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
          : 'bg-zinc-200 border-zinc-300 shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] dark:bg-zinc-800 dark:border-zinc-600 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
      )}
    >
      <span
        className={clsx(
          'absolute left-[6px] grid h-5 w-5 place-items-center rounded-full',
          'bg-white text-zinc-700',
          'transition-transform duration-200 ease-out will-change-transform',
          'shadow-[0_1px_1px_rgba(0,0,0,0.15),inset_0_0_0_1px_rgba(0,0,0,0.04)]',
          enabled ? 'translate-x-4.5' : '-translate-x-1'
        )}
      >
        <MapIcon
          className={clsx(
            'h-3.5 w-3.5 transition-colors',
            enabled ? 'text-indigo-600' : 'text-zinc-400 dark:text-zinc-800'
          )}
        />
      </span>

      {/* Dekoracyjna lekka ramka toru w stanie ON (podkreślenie jak na makiecie) */}
      <span
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute inset-0 rounded-full',
          'transition-opacity',
          enabled
            ? 'ring-1 ring-inset ring-indigo-500/60 opacity-100'
            : 'opacity-0'
        )}
      />
    </button>
  );
}

export function ToggleMap({
  enable,
  onToggle,
}: {
  enable: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm opacity-70 sm:inline">Map</span>
      <MapToggleSwitch enabled={enable} onToggle={onToggle} />
    </div>
  );
}
