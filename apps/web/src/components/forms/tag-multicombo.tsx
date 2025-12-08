'use client';

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  offset,
  shift,
  size as s,
  useFloating,
} from '@floating-ui/react';
import { Folder, Loader2, Search, TagsIcon, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { getUseTagsLimitData, useTags } from '@/features/events/hooks/use-tags';
import { TagOption } from '@/features/tags/types';

export type TagMultiComboProps = {
  values: TagOption[];
  onChange: (values: TagOption[]) => void;

  initialOptions?: TagOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxCount?: number; // default 3
  size?: 'sm' | 'md' | 'lg';
  placement?:
    | 'bottom-start'
    | 'bottom-end'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'top';
  strategy?: 'absolute' | 'fixed';
};

export function TagMultiCombo({
  values,
  onChange,
  initialOptions,
  placeholder = 'Search tag...',
  disabled,
  className,
  maxCount = 3,
  size = 'md',
  placement = 'bottom-start',
  strategy = 'fixed',
}: TagMultiComboProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);

  const listboxId = useId();

  const { options, isLoading, error } = useTags(query, initialOptions);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedIds = useMemo(() => new Set(values.map((v) => v.id)), [values]);
  const visibleOptions = useMemo(
    () => options.filter((o) => !selectedIds.has(o.id)),
    [options, selectedIds]
  );

  const canAddMore = values.length < maxCount;

  // Floating UI
  const listRef = useRef<HTMLDivElement | null>(null);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    strategy,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(2),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      s({
        apply({ rects, availableHeight, elements }) {
          const floating = elements.floating as HTMLElement;
          floating.style.maxHeight = `${Math.min(Math.max(240, availableHeight), 320)}px`;
          floating.style.width = `${rects.reference.width}px`;
        },
      }),
    ],
  });

  // reference = wrapper
  useEffect(() => {
    refs.setReference(wrapperRef.current);
  }, [refs]);

  // zamykanie na klik poza
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      const refEl = wrapperRef.current;
      const floatEl = listRef.current;
      if (refEl?.contains(t) || floatEl?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // akcje
  const pick = (opt: TagOption) => {
    if (!canAddMore) return;
    onChange([...values, opt]);
    setQuery('');
    setHi(-1);
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const remove = (id: string) => {
    onChange(values.filter((v) => v.id !== id));
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const activeOptionId =
    hi >= 0 && visibleOptions[hi]
      ? `tag-opt-${visibleOptions[hi].id}`
      : undefined;

  const sizeCls =
    size === 'sm'
      ? {
          chip: 'h-7 text-[13px] px-2',
          inputPadY: 'py-1.5',
          icon: 'h-4 w-4',
          wrapPad: 'p-1.5',
        }
      : size === 'lg'
        ? {
            chip: 'h-9 text-sm px-3',
            inputPadY: 'py-2.5',
            icon: 'h-5 w-5',
            wrapPad: 'p-2.5',
          }
        : {
            chip: 'h-8 text-sm px-3',
            inputPadY: 'py-2',
            icon: 'h-4 w-4',
            wrapPad: 'p-2',
          };

  const showPlaceholder = values.length === 0 && query.length === 0;

  return (
    <div
      ref={wrapperRef}
      className={[
        'relative rounded-2xl border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-900/60',
        sizeCls.wrapPad,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => inputRef.current?.focus()}
    >
      <div
        className={[
          'flex flex-wrap items-center gap-2 px-1',
          disabled ? 'opacity-60 pointer-events-none' : '',
        ].join(' ')}
      >
        <TagsIcon className={`${sizeCls.icon} opacity-70`} aria-hidden />

        {values.map((v) => (
          <span
            key={v.id}
            className={[
              'inline-flex items-center gap-2 rounded-full',
              'bg-zinc-100 text-zinc-800 ring-1 ring-inset ring-zinc-200',
              'dark:bg-zinc-800/70 dark:text-zinc-100 dark:ring-zinc-700',
              sizeCls.chip,
            ].join(' ')}
          >
            {v.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(v.id);
              }}
              className="inline-flex items-center justify-center rounded-full bg-zinc-200/60 p-1 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700/60 dark:text-zinc-200 dark:hover:bg-zinc-700"
              aria-label={`Remove ${v.label}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        {/* input */}
        <div className="relative flex-1 min-w-[8ch]">
          <input
            ref={inputRef}
            disabled={disabled || !canAddMore}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHi(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && query === '' && values.length) {
                e.preventDefault();
                const id = values?.[values?.length - 1]?.id;
                if (id) remove(id);
                return;
              }
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
            placeholder={showPlaceholder ? placeholder : ''}
            className={[
              'w-full bg-transparent outline-none placeholder:text-zinc-400',
              sizeCls.inputPadY,
              'text-sm',
            ].join(' ')}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
          />

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
            {query ? null : isLoading ? (
              <Loader2
                className={`${sizeCls.icon} animate-spin opacity-60`}
                aria-label="Loading"
              />
            ) : (
              <Search className={`${sizeCls.icon} opacity-60`} aria-hidden />
            )}
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {open && (query.length > 0 || visibleOptions.length > 0) && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={(node) => {
              listRef.current = node;
              refs.setFloating(node);
            }}
            id={listboxId}
            style={floatingStyles}
            className="z-20 mt-2 max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            role="listbox"
            aria-label="Tags"
          >
            {error && (
              <div className="px-3 py-3 text-sm text-red-500">
                Wystąpił błąd. Spróbuj ponownie później.
              </div>
            )}

            {visibleOptions.length === 0 && !isLoading && (
              <div className="px-3 py-3 text-sm text-zinc-500">No results</div>
            )}

            {visibleOptions.length !== 0 && (
              <>
                {visibleOptions.map((opt, idx) => {
                  const active = idx === hi;
                  return (
                    <button
                      key={opt.id}
                      id={`tag-opt-${opt.id}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseDown={(e) => e.preventDefault()}
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
                        {opt.label}
                      </span>
                    </button>
                  );
                })}

                {typeof getUseTagsLimitData() === 'number' && (
                  <div className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-700">
                    Pokazujemy maksymalnie <b>{getUseTagsLimitData()}</b>{' '}
                    wyników. Zmień kryteria, aby zobaczyć pozostałe.
                  </div>
                )}
              </>
            )}
          </div>
        </FloatingFocusManager>
      )}

      {!canAddMore && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-amber-400/50"
          aria-hidden
          title="You reached the max number of tags"
        />
      )}
    </div>
  );
}
