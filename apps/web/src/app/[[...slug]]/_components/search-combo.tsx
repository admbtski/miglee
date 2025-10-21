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
import { Search, Tag as TagIcon, Hash, Folder, X } from 'lucide-react';

type GroupId = 'TAG' | 'KEYWORD' | 'CATEGORY' | (string & {});
type ItemKind = 'tag' | 'keyword' | 'category' | (string & {});

export type SearchGroup = {
  id: GroupId;
  label: string;
  items: string[];
  selected?: string[];
  onSelect?: (value: string) => void;
  kind?: ItemKind;
  icon?: React.ComponentType<{ className?: string }>;
};

type FlatRow =
  | { type: 'header'; gi: number }
  | { type: 'item'; gi: number; label: string };

export type SearchComboProps = {
  groups: SearchGroup[];
  value?: string;
  onChangeValue?: (v: string) => void;
  onSubmitFreeText?: (text: string) => void;
  placeholder?: string;
  clearButton?: boolean;
  className?: string;
  loading?: boolean;
};

const MIN_CHARS = 3;

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

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
      className={cx('relative inline-block', className)}
      role="status"
      aria-label="Loading"
    >
      <span className="block w-4 h-4 border-2 rounded-full animate-spin border-zinc-300 border-t-transparent dark:border-zinc-600 dark:border-t-transparent" />
    </span>
  );
}

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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
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

  // render what comes from parent (no local filtering)
  const { rows, itemRowIdx } = useMemo(() => {
    const out: FlatRow[] = [];
    groups.forEach((g, gi) => {
      const exclude = new Set((g.selected ?? []).map((s) => s.toLowerCase()));
      const pool = g.items.filter((x) => !exclude.has(x.toLowerCase()));
      if (!pool.length) return;
      out.push({ type: 'header', gi });
      pool
        .slice()
        .sort((a, b) => a.localeCompare(b, 'en'))
        .forEach((label) => out.push({ type: 'item', gi, label }));
    });
    const idx = out
      .map((r, i) => (r.type === 'item' ? i : -1))
      .filter((i) => i >= 0);
    return { rows: out, itemRowIdx: idx };
  }, [groups]);

  const move = useCallback(
    (delta: number) => {
      if (!itemRowIdx.length) {
        setHi(-1);
        return;
      }
      const pos = hi < 0 ? -1 : itemRowIdx.indexOf(hi);
      const next = Math.max(0, Math.min(itemRowIdx.length - 1, pos + delta));
      setHi(itemRowIdx[next]);
    },
    [hi, itemRowIdx]
  );

  const pickAt = useCallback(
    (idx: number) => {
      const row = rows[idx];
      if (!row || row.type !== 'item') return;
      const g = groups[row.gi];
      g.onSelect?.(row.label);
      setOpen(false);
      setHi(-1);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [rows, groups, setInputVal]
  );

  // outside click -> close
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!inputRef.current?.contains(t) && !listRef.current?.contains(t))
        setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

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
        if (itemRowIdx.length) setHi(itemRowIdx[0]);
      } else if (e.key === 'End') {
        e.preventDefault();
        if (itemRowIdx.length) setHi(itemRowIdx[itemRowIdx.length - 1]);
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

  // dropdown shows always when open; content depends on state

  return (
    <div
      className={cx(
        'relative rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900',
        className
      )}
    >
      <label className="flex items-center gap-2 px-1">
        <Search className="w-4 h-4 opacity-60" />
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
          className="w-full py-2 text-sm bg-transparent outline-none placeholder:text-zinc-400"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
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
              onChangeValue?.(''); // allow parent to clear results
              inputRef.current?.focus();
            }}
            className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Clear"
          >
            <X className="w-4 h-4 opacity-60" />
          </button>
        )}
      </label>

      {open && (
        <div
          ref={listRef}
          id={listboxId}
          className="absolute left-0 right-0 z-20 mt-2 overflow-auto bg-white border shadow-lg max-h-72 rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900"
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
                  className="px-3 py-2 text-xs font-semibold tracking-wider uppercase text-zinc-400"
                >
                  {groups[row.gi].label}
                </div>
              ) : (
                <button
                  key={`it-${row.gi}-${row.label}`}
                  role="option"
                  aria-selected={hi === idx}
                  onMouseEnter={() => setHi(idx)}
                  onClick={() => pickAt(idx)}
                  className={cx(
                    'flex w-full items-center gap-3 px-3 py-2 text-left text-sm',
                    hi === idx
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  )}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full ring-1 ring-zinc-200 dark:ring-zinc-700">
                    {(() => {
                      const G = groups[row.gi];
                      const Icon = G.icon ?? defaultIconFor(G.kind ?? G.id);
                      return <Icon className="h-3.5 w-3.5 opacity-80" />;
                    })()}
                  </span>
                  <span className="text-zinc-800 dark:text-zinc-100">
                    {row.label}
                  </span>
                </button>
              )
            )
          )}
        </div>
      )}
    </div>
  );
}

export default memo(_SearchCombo);
