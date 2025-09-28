'use client';

import { useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react';
import { ChevronDown, Map as MapIcon } from 'lucide-react';
import clsx from 'clsx';

export type SortKey = 'default' | 'latest' | 'salary_desc' | 'salary_asc';

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'latest', label: 'Latest' },
  { value: 'salary_desc', label: 'Highest salary' },
  { value: 'salary_asc', label: 'Lowest salary' },
];

/* =========================
   Map toggle – styl jak w zrzutach
   ========================= */
function MapToggleSwitch({
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
        // focus ring (z offsetem, dobrze widoczny w obu motywach)
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/40',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
        enabled
          ? // ON: fioletowy tor + lekki „inner” gloss
            'bg-indigo-600 border-indigo-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
          : // OFF: jasny w light, ciemnoszary w dark
            'bg-zinc-200 border-zinc-300 shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] dark:bg-zinc-800 dark:border-zinc-600 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
      )}
    >
      {/* Gałka z ikoną mapy */}
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

/* =========================
   SortControl
   ========================= */
export function SortControl({
  value,
  onChange,
  className = '',
  withMapToggle,
  mapEnabled,
  onToggleMap,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
  className?: string;
  withMapToggle?: boolean;
  mapEnabled?: boolean;
  onToggleMap?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const current = useMemo(
    () => OPTIONS.find((o) => o.value === value) ?? OPTIONS[0],
    [value]
  );

  // Zamknij dropdown poza kliknięciem / na Escape
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div className={clsx('relative inline-flex items-center gap-3', className)}>
      {/* Switch mapy + etykieta */}
      {withMapToggle && typeof mapEnabled === 'boolean' && onToggleMap && (
        <div className="flex items-center gap-2">
          <span className="hidden text-sm opacity-70 sm:inline">Map</span>
          <MapToggleSwitch enabled={mapEnabled} onToggle={onToggleMap} />
        </div>
      )}

      {/* Przycisk „Sort by” (styl zgodny z resztą UI) */}
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm cursor-pointer',
          'bg-zinc-200 text-zinc-900 hover:bg-zinc-300',
          'dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950'
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="opacity-80">Sort by:</span>
        <span className="font-medium">{current.label}</span>
        <ChevronDown className="h-4 w-4 opacity-80" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={clsx(
            'absolute right-0 top-[calc(100%+8px)] z-50 w-56 p-1',
            'rounded-2xl border bg-white shadow-2xl ring-1 ring-black/5',
            'border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900'
          )}
        >
          {OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={clsx(
                  'block w-full select-none rounded-xl px-3 py-2 text-left text-sm cursor-pointer',
                  active
                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-100'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
