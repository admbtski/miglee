'use client';
import clsx from 'clsx';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MeetingKind } from '@/lib/api/__generated__/react-query-update';

const KIND_OPTIONS: { value: MeetingKind; label: string }[] = [
  { value: MeetingKind.Onsite, label: 'Onsite' },
  { value: MeetingKind.Online, label: 'Online' },
  { value: MeetingKind.Hybrid, label: 'Hybrid' },
];

export function KindFilter({
  values,
  onChange,
}: {
  values: MeetingKind[];
  onChange: (v: MeetingKind[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const label = useMemo(() => {
    if (!values?.length) return 'Wszystkie';
    if (values.length === 1)
      return (
        KIND_OPTIONS.find((o) => o.value === values[0])?.label ?? '1 wybrany'
      );
    return `${values.length} wybrane`;
  }, [values]);

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

  const toggleValue = (v: MeetingKind) => {
    const set = new Set(values);
    if (set.has(v)) set.delete(v);
    else set.add(v);
    onChange(Array.from(set));
  };

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
        <span className="opacity-80">Rodzaj:</span>
        <span className="font-medium">{label}</span>
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
          {KIND_OPTIONS.map((opt) => {
            const active = values.includes(opt.value);
            return (
              <button
                key={opt.value}
                role="menuitemcheckbox"
                aria-checked={active}
                onClick={() => toggleValue(opt.value)}
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

          <div className="mt-1 flex gap-1 p-1">
            <button
              className="flex-1 rounded-xl px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => onChange([])}
            >
              Wyczyść
            </button>
            <button
              className="flex-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
              onClick={() => setOpen(false)}
            >
              Zastosuj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
