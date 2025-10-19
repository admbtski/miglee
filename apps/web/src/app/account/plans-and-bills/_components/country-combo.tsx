'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

type Country = { code: string; name: string; flag: string };

const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'CZ', name: 'Czechia', flag: '🇨🇿' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
];

const cx = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(' ');

export function CountryCombo({
  label = 'Country',
  value,
  onChange,
  placeholder = 'Search country…',
  className,
}: {
  label?: string;
  value?: string; // 'PL', 'US', ...
  onChange?: (code: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const listboxId = useId();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState<number>(-1);

  const selected = useMemo(
    () => COUNTRIES.find((c) => c.code === value) ?? null,
    [value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={cx('block', className)} ref={wrapRef}>
      <div className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </div>

      {/* trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="flex items-center justify-between w-full px-3 py-2 text-sm text-left bg-white border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        {selected ? (
          <span className="flex items-center min-w-0 gap-2">
            <span className="grid w-6 h-6 rounded-md shrink-0 place-items-center ring-1 ring-zinc-200 dark:ring-zinc-700">
              <span className="text-base leading-none">{selected.flag}</span>
            </span>
            <span className="truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="opacity-60">Choose a country</span>
        )}
        <svg
          className="w-4 h-4 opacity-60"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.25 7.5l4.5 4.5 4.5-4.5" />
        </svg>
      </button>

      {/* dropdown */}
      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="relative z-20 p-2 mt-2 bg-white border shadow-xl rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {/* search bar */}
          <div
            className="
              mb-2 flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm
              border-zinc-200 bg-white
              dark:border-zinc-700 dark:bg-zinc-900
            "
          >
            <Search className="w-4 h-4 opacity-60" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHi(-1);
              }}
              placeholder={placeholder}
              className="w-full bg-transparent outline-none placeholder:text-zinc-400"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHi((i) => Math.min(filtered.length - 1, i + 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHi((i) => Math.max(0, i - 1));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  const pick = filtered[Math.max(0, hi)];
                  if (pick) {
                    onChange?.(pick.code);
                    setOpen(false);
                  }
                } else if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
            />
          </div>

          <div className="overflow-auto max-h-64">
            {filtered.length === 0 ? (
              <div className="px-2 py-3 text-sm text-zinc-500">No results</div>
            ) : (
              filtered.map((c, idx) => (
                <button
                  key={c.code}
                  role="option"
                  aria-selected={value === c.code}
                  onMouseEnter={() => setHi(idx)}
                  onClick={() => {
                    onChange?.(c.code);
                    setOpen(false);
                  }}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm',
                    // LIGHT hover
                    'hover:bg-zinc-50',
                    // DARK hover (nadpisuje light)
                    'dark:hover:bg-zinc-800',
                    // active row highlight
                    hi === idx && 'bg-zinc-100 dark:bg-zinc-800'
                  )}
                >
                  <span className="grid w-6 h-6 rounded-md shrink-0 place-items-center ring-1 ring-zinc-200 dark:ring-zinc-700">
                    <span className="text-base leading-none">{c.flag}</span>
                  </span>
                  <span className="truncate">{c.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
