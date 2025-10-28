// file: components/manage-members/ActionsDropdown.tsx
'use client';

import * as React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useOutsideClose } from './useOutsideClose';

export type ActionItem =
  | {
      key: string;
      label: string;
      icon: React.ReactNode;
      onClick?: () => void | Promise<void>;
      danger?: boolean;
      disabled?: boolean;
    }
  | 'divider';

export function ActionsDropdown({
  disabled,
  actions,
}: {
  disabled?: boolean;
  actions: ActionItem[];
}) {
  const [open, setOpen] = React.useState(false);
  const ref = useOutsideClose<HTMLDivElement>(() => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((s) => !s)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(
          'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition',
          disabled
            ? 'cursor-not-allowed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600'
            : 'cursor-pointer border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
        )}
      >
        Akcje
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <ul className="py-1 text-sm">
            {actions.map((a, i) =>
              a === 'divider' ? (
                <li
                  key={`div-${i}`}
                  className="my-1 border-t border-zinc-200 dark:border-zinc-800"
                />
              ) : (
                <li key={a.key}>
                  <button
                    type="button"
                    disabled={a.disabled}
                    onClick={async () => {
                      await a.onClick?.();
                      setOpen(false);
                    }}
                    className={clsx(
                      'flex w-full items-center gap-2 px-3 py-2 text-left transition',
                      a.disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                      a.danger ? 'text-rose-600 dark:text-rose-400' : ''
                    )}
                  >
                    {a.icon}
                    <span>{a.label}</span>
                  </button>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
