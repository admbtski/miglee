'use client';

import { useId, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import {
  IntentsSortBy,
  SortDir,
} from '@/libs/graphql/__generated__/react-query-update';

export type SortChoice = { by: IntentsSortBy; dir: SortDir };

const CHOICES: Array<{ label: string; by: IntentsSortBy; dir: SortDir }> = [
  { label: 'Start time — asc', by: IntentsSortBy.StartAt, dir: SortDir.Asc },
  { label: 'Start time — desc', by: IntentsSortBy.StartAt, dir: SortDir.Desc },
  { label: 'Created — desc', by: IntentsSortBy.CreatedAt, dir: SortDir.Desc },
  { label: 'Created — asc', by: IntentsSortBy.CreatedAt, dir: SortDir.Asc },
  { label: 'Updated — desc', by: IntentsSortBy.UpdatedAt, dir: SortDir.Desc },
  { label: 'Updated — asc', by: IntentsSortBy.UpdatedAt, dir: SortDir.Asc },
  {
    label: 'Members — desc',
    by: IntentsSortBy.MembersCount,
    dir: SortDir.Desc,
  },
  { label: 'Members — asc', by: IntentsSortBy.MembersCount, dir: SortDir.Asc },
];

function labelFor(val: SortChoice) {
  return (
    CHOICES.find((c) => c.by === val.by && c.dir === val.dir)?.label ??
    'Start time — asc'
  );
}

/** Pigułka jak StatusFilter: label z lewej, value, chevron, menu */
export function SortFilter({
  value,
  onChange,
  className,
  label = 'Sortuj',
}: {
  value: SortChoice;
  onChange: (next: SortChoice) => void;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <div className={clsx('relative inline-block', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm',
          'border-zinc-200 bg-transparent hover:bg-zinc-100',
          'dark:border-zinc-800 dark:hover:bg-zinc-800'
        )}
      >
        <span className="text-zinc-500 dark:text-zinc-400">{label}:</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {labelFor(value)}
        </span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </button>

      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-30 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div
            id={listId}
            role="listbox"
            className={clsx(
              'absolute z-40 mt-2 w-[240px] overflow-hidden rounded-xl border bg-white shadow-lg',
              'border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900'
            )}
          >
            <ul className="max-h-72 overflow-auto py-1 text-sm">
              {CHOICES.map((c) => {
                const active = c.by === value.by && c.dir === value.dir;
                return (
                  <li key={`${c.by}-${c.dir}`}>
                    <button
                      role="option"
                      aria-selected={active}
                      className={clsx(
                        'block w-full px-3 py-2 text-left',
                        active
                          ? 'bg-zinc-100 font-medium dark:bg-zinc-800'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                      )}
                      onClick={() => {
                        onChange({ by: c.by, dir: c.dir });
                        setOpen(false);
                      }}
                    >
                      {c.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
