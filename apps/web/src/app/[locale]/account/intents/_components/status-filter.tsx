'use client';
import { IntentStatus } from '@/lib/api/__generated__/react-query-update';
import clsx from 'clsx';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const STATUS_OPTIONS: { value: IntentStatus; label: string }[] = [
  { value: IntentStatus.Any, label: 'Dowolny' },
  { value: IntentStatus.Upcoming, label: 'Nadchodzące' },
  { value: IntentStatus.Ongoing, label: 'Trwa teraz' },
  { value: IntentStatus.Past, label: 'Przeszłe' },
  { value: IntentStatus.Canceled, label: 'Anulowane' },
  { value: IntentStatus.Deleted, label: 'Usunięte' },
];

export function StatusFilter({
  value,
  onChange,
}: {
  value: IntentStatus;
  onChange: (v: IntentStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const current = useMemo(
    () => STATUS_OPTIONS.find((o) => o.value === value) ?? STATUS_OPTIONS[0],
    [value]
  );

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t))
        setOpen(false);
    }
    function onEsc(e: KeyboardEvent & any) {
      if ((e as KeyboardEvent).key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div className="relative">
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
        <span className="opacity-80">Status:</span>
        <span className="font-medium">{current?.label ?? ''}</span>
        <ChevronDown className="h-4 w-4 opacity-80" />
      </button>

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
          {STATUS_OPTIONS.map((opt) => {
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
                  'flex w-full select-none items-center justify-between rounded-xl px-3 py-2 text-left text-sm cursor-pointer',
                  active
                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-100'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <span>{opt.label}</span>
                {active && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
