'use client';

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from 'react';
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  offset,
  shift,
  size as floatingSize,
  useFloating,
} from '@floating-ui/react';
import { Search, Tag as TagIcon, Hash, Folder, X } from 'lucide-react';

import clsx from 'clsx';
import { TagOption } from '@/features/tags';
import { CategoryOption } from '@/features/categories';

export type SearchOption = TagOption | CategoryOption;

type GroupId = 'TAG' | 'KEYWORD' | 'CATEGORY' | (string & {});
type ItemKind = 'tag' | 'keyword' | 'category' | (string & {});

export type SearchGroup = {
  id: GroupId;
  label: string;
  items: SearchOption[];
  /** Already selected options in this group (used to hide them in list) */
  selected?: SearchOption[];
  /** Called when user picks an option from this group */
  onSelect?: (option: SearchOption) => void;
  /** Visual hint for default icon */
  kind?: ItemKind;
  /** Optional custom icon */
  icon?: React.ComponentType<{ className?: string }>;
};

type FlatRow =
  | { type: 'header'; gi: number }
  | { type: 'item'; gi: number; option: SearchOption };

export type SearchComboProps = {
  groups: SearchGroup[];
  /** Free text input value (controlled) */
  value?: string;
  /** Called when free text changes (only after MIN_CHARS) */
  onChangeValue?: (v: string) => void;
  /** Called when user hits Enter with no highlighted item */
  onSubmitFreeText?: (text: string) => void;
  placeholder?: string;
  clearButton?: boolean;
  className?: string;
  loading?: boolean;
};

const MIN_CHARS = 3;

const defaultIconFor = (idOrKind?: GroupId | ItemKind) => {
  switch (idOrKind) {
    case 'TAG':
    case 'tag':
      return TagIcon;
    case 'KEYWORD':
    case 'keyword':
      return Hash;
    case 'CATEGORY':
    case 'category':
      return Folder;
    default:
      return Folder;
  }
};

/** Tiny inline spinner (currentColor) */
function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx('relative inline-block', className)}
      role="status"
      aria-label="Loading"
    >
      <span className="block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent dark:border-zinc-600 dark:border-t-transparent" />
    </span>
  );
}

/** Helpers to identify options robustly */
const optKey = (o: SearchOption) => o.id || o.slug || o.label;
const optLabel = (o: SearchOption) => o.label ?? o.slug ?? o.id ?? '—';

function _SearchCombo({
  groups,
  value,
  onChangeValue,
  onSubmitFreeText,
  placeholder = 'Search…',
  clearButton = true,
  className,
  loading = false,
}: SearchComboProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();

  // local input state so we can gate requests by MIN_CHARS
  const [inner, setInner] = useState(value ?? '');
  useEffect(() => {
    if (value !== undefined && value !== inner) setInner(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const setInputVal = useCallback(
    (val: string) => {
      setInner(val);
      if (val.trim().length >= MIN_CHARS) onChangeValue?.(val);
    },
    [onChangeValue]
  );

  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState<number>(-1);

  const canSearch = inner.trim().length >= MIN_CHARS;

  // Floating UI setup
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-start',
    strategy: 'fixed', // Use fixed to escape parent stacking context
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      floatingSize({
        apply({ rects, elements }) {
          const floating = elements.floating as HTMLElement;
          floating.style.maxHeight = '288px'; // max-h-72 = 18rem = 288px
          floating.style.width = `${rects.reference.width}px`;
        },
      }),
    ],
  });

  // Set reference element
  useEffect(() => {
    refs.setReference(wrapperRef.current);
  }, [refs]);

  // Render rows: headers + items (filtered: hide already selected)
  const { rows, itemRowIdx } = useMemo(() => {
    const out: FlatRow[] = [];

    groups.forEach((g, gi) => {
      const selectedSet = new Set(
        (g.selected ?? []).map((s) => (s.id || s.slug || s.label).toLowerCase())
      );

      const pool = g.items.filter(
        (x) => !selectedSet.has(optKey(x).toLowerCase())
      );

      if (!pool.length) return;

      out.push({ type: 'header', gi });

      pool
        .slice()
        .sort((a, b) => optLabel(a).localeCompare(optLabel(b), 'en'))
        .forEach((option) => out.push({ type: 'item', gi, option }));
    });

    const itemIdx = out
      .map((r, i) => (r.type === 'item' ? i : -1))
      .filter((i) => i >= 0);

    return { rows: out, itemRowIdx: itemIdx };
  }, [groups]);

  const move = useCallback(
    (delta: number) => {
      if (!itemRowIdx.length) {
        setHi(-1);
        return;
      }
      const pos = hi < 0 ? -1 : itemRowIdx.indexOf(hi);
      const next = Math.max(0, Math.min(itemRowIdx.length - 1, pos + delta));
      const nextIdx = itemRowIdx[next];
      if (nextIdx !== undefined) {
        setHi(nextIdx);
      }
    },
    [hi, itemRowIdx]
  );

  const pickAt = useCallback(
    (idx: number) => {
      const row = rows[idx];
      if (!row || row.type !== 'item') return;
      const g = groups[row.gi];
      if (!g) return;
      g.onSelect?.(row.option);
      setOpen(false);
      setHi(-1);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [rows, groups]
  );

  // outside click -> close (handled by FloatingFocusManager)

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        move(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        move(-1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        const firstIdx = itemRowIdx[0];
        if (firstIdx !== undefined) setHi(firstIdx);
      } else if (e.key === 'End') {
        e.preventDefault();
        const lastIdx = itemRowIdx[itemRowIdx.length - 1];
        if (lastIdx !== undefined) setHi(lastIdx);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (hi >= 0) {
          pickAt(hi);
        } else if (canSearch && inner.trim() && onSubmitFreeText) {
          onSubmitFreeText(inner.trim());
          setOpen(false);
        } else {
          setOpen(false);
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [open, move, itemRowIdx, hi, pickAt, inner, onSubmitFreeText, canSearch]
  );

  // aria-activedescendant target id
  const activeOptionId =
    hi >= 0 && rows[hi]?.type === 'item'
      ? `opt-${rows[hi]!.gi}-${optKey((rows[hi] as any).option)}`
      : undefined;

  return (
    <div
      ref={wrapperRef}
      className={clsx(
        'relative rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900',
        className
      )}
    >
      <label className="flex items-center gap-2 px-1">
        <Search className="h-4 w-4 opacity-60" aria-hidden />
        <input
          ref={inputRef}
          value={inner}
          onChange={(e) => {
            setInputVal(e.target.value);
            setOpen(true);
            setHi(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-busy={loading || undefined}
        />
        {loading && <Spinner className="ml-1" />}
        {clearButton && inner && (
          <button
            type="button"
            onClick={() => {
              setInner('');
              setOpen(true);
              setHi(-1);
              onChangeValue?.(''); // let parent clear results
              inputRef.current?.focus();
            }}
            className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Clear"
          >
            <X className="h-4 w-4 opacity-60" />
          </button>
        )}
      </label>

      {open && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            id={listboxId}
            style={floatingStyles}
            className="z-[150] overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            role="listbox"
          >
            {!canSearch ? (
              <div className="px-3 py-3 text-sm text-zinc-500">
                Type at least {MIN_CHARS} characters
              </div>
            ) : rows.length === 0 ? (
              <div className="px-3 py-3 text-sm text-zinc-500">
                No suggestions
              </div>
            ) : (
              rows.map((row, idx) =>
                row.type === 'header' ? (
                  <div
                    key={`hdr-${idx}`}
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400"
                  >
                    {groups[row.gi]?.label}
                  </div>
                ) : (
                  <button
                    key={`it-${row.gi}-${optKey(row.option)}`}
                    id={`opt-${row.gi}-${optKey(row.option)}`}
                    role="option"
                    aria-selected={hi === idx}
                    onMouseEnter={() => setHi(idx)}
                    onClick={() => pickAt(idx)}
                    className={clsx(
                      'flex w-full items-center gap-3 px-3 py-2 text-left text-sm',
                      hi === idx
                        ? 'bg-zinc-100 dark:bg-zinc-800'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                    )}
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-zinc-200 dark:ring-zinc-700">
                      {(() => {
                        const G = groups[row.gi];
                        if (!G) return null;
                        const Icon = G.icon ?? defaultIconFor(G.kind ?? G.id);
                        return <Icon className="h-3.5 w-3.5 opacity-80" />;
                      })()}
                    </span>
                    <span className="text-zinc-800 dark:text-zinc-100">
                      {optLabel(row.option)}
                    </span>
                  </button>
                )
              )
            )}
          </div>
        </FloatingFocusManager>
      )}
    </div>
  );
}

export default memo(_SearchCombo);
