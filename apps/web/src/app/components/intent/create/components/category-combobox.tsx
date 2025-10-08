// components/category-combo/CategoryCombo.tsx
'use client';

import { Folder, Loader2, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCategories } from '../hooks/use-categories';
import { CategoryOption } from '../../types';

export type CategoryComboProps = {
  /** aktualna wartość (id kategorii) */
  value: string | null;
  /** callback po wyborze opcji (id) */
  onChange: (id: string | null) => void;

  /** opcjonalnie: początkowe opcje do wyświetlenia (np. z SSR) */
  initialOptions?: CategoryOption[];

  /** placeholder inputa */
  placeholder?: string;

  /** disabled */
  disabled?: boolean;

  /** klasa wrappera */
  className?: string;

  /** widoczna etykieta zaznaczonej kategorii (jeśli nie chcesz szukać po options) */
  selectedLabelOverride?: string | null;
};

/**
 * Pojedynczy, prosty combo (typeahead) tylko do kategorii,
 * z async pobieraniem opcji przez hook useCategories (debounce + cache).
 */
export function CategoryCombo({
  value,
  onChange,
  initialOptions,
  placeholder = 'Search category…',
  disabled,
  className,
  selectedLabelOverride,
}: CategoryComboProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);

  const { options, loading } = useCategories(query, initialOptions);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // znajdź label aktualnie wybranej wartości
  const selectedLabel = useMemo(() => {
    if (selectedLabelOverride != null) return selectedLabelOverride || '';
    const found = options.find((o) => o.id === value);
    return found?.name ?? '';
  }, [options, value, selectedLabelOverride]);

  // zamknij dropdown przy kliknięciu poza
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!inputRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const visibleOptions = options;

  const pick = (opt: CategoryOption) => {
    onChange(opt.id);
    setQuery('');
    setOpen(false);
    setHi(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div
      className={[
        'relative rounded-2xl border border-zinc-300 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900/60',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <label className="flex items-center gap-2 px-1">
        <Folder className="h-4 w-4 opacity-70" />
        <input
          ref={inputRef}
          disabled={disabled}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHi(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHi((h) => Math.min(h + 1, visibleOptions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHi((h) => Math.max(h - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (hi >= 0 && visibleOptions[hi]) pick(visibleOptions[hi]);
              else setOpen(false);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400"
          aria-expanded={open}
          role="combobox"
        />
        {query ? (
          <button
            type="button"
            className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => {
              setQuery('');
              setOpen(true);
              setHi(-1);
              inputRef.current?.focus();
            }}
            aria-label="Clear"
          >
            <X className="h-4 w-4 opacity-60" />
          </button>
        ) : loading ? (
          <Loader2 className="h-4 w-4 animate-spin opacity-60" />
        ) : (
          <Search className="h-4 w-4 opacity-60" />
        )}
      </label>

      {/* Selected preview (poza inputem) */}
      {value && selectedLabel && (
        <div className="mt-1 flex items-center gap-2 px-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800/70">
            <Folder className="h-3.5 w-3.5 opacity-70" />
            {selectedLabel}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Clear selected category"
            title="Clear"
          >
            <X className="h-3.5 w-3.5 opacity-70" />
          </button>
        </div>
      )}

      {open && (query.length > 0 || visibleOptions.length > 0) && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="listbox"
        >
          {visibleOptions.length === 0 ? (
            <div className="px-3 py-3 text-sm text-zinc-500">No results</div>
          ) : (
            visibleOptions.map((opt, idx) => {
              const active = idx === hi;
              return (
                <button
                  key={opt.id}
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setHi(idx)}
                  onClick={() => pick(opt)}
                  className={[
                    'flex w-full items-center gap-3 px-3 py-2 text-left text-sm',
                    active
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
                  ].join(' ')}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-zinc-200 dark:ring-zinc-700">
                    <Folder className="h-3.5 w-3.5 opacity-80" />
                  </span>
                  <span className="text-zinc-800 dark:text-zinc-100">
                    {opt.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
