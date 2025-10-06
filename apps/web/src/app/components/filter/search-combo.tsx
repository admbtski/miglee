'use client';

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Search, Tag as TagIcon, Hash, Folder, X } from 'lucide-react';

type GroupId = 'TAG' | 'KEYWORD' | 'CATEGORY' | (string & {});
type ItemKind = 'tag' | 'keyword' | 'category' | (string & {});

export type SearchGroup = {
  id: GroupId; // group key
  label: string; // section header
  items: string[]; // available suggestions
  selected?: string[]; // already chosen -> hidden from list
  onSelect?: (value: string) => void; // pick handler
  kind?: ItemKind; // for default icon
  icon?: React.ComponentType<{ className?: string }>; // optional custom icon
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
};

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

function _SearchCombo({
  groups,
  value,
  onChangeValue,
  onSubmitFreeText,
  placeholder = 'Search…',
  clearButton = true,
  className,
}: SearchComboProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [inner, setInner] = useState('');
  const inputVal = value ?? inner;
  const setInputVal = useCallback(
    (v: string) => (onChangeValue ? onChangeValue(v) : setInner(v)),
    [onChangeValue]
  );

  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState<number>(-1); // highlighted row in flatRows

  const { rows, itemRowIdx } = useMemo(() => {
    const q = inputVal.trim().toLowerCase();
    const out: FlatRow[] = [];

    groups.forEach((g, gi) => {
      const exclude = new Set((g.selected ?? []).map((s) => s.toLowerCase()));
      const pool = (
        q ? g.items.filter((x) => x.toLowerCase().includes(q)) : g.items
      ).filter((x) => !exclude.has(x.toLowerCase()));
      if (!pool.length) return;
      out.push({ type: 'header', gi });
      pool
        .slice() // defensive copy
        .sort((a, b) => a.localeCompare(b, 'en'))
        .forEach((label) => out.push({ type: 'item', gi, label }));
    });

    const idx = out
      .map((r, i) => (r.type === 'item' ? i : -1))
      .filter((i) => i >= 0);
    return { rows: out, itemRowIdx: idx };
  }, [groups, inputVal]);

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
      setInputVal('');
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
        if (hi >= 0) pickAt(hi);
        else if (inputVal.trim() && onSubmitFreeText) {
          onSubmitFreeText(inputVal.trim());
          setOpen(false);
        } else {
          setOpen(false);
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [open, move, itemRowIdx, hi, pickAt, inputVal, onSubmitFreeText]
  );

  return (
    <div
      className={[
        'relative rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <label className="flex items-center gap-2 px-1">
        <Search className="h-4 w-4 opacity-60" />
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            setOpen(true);
            setHi(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="searchcombo-listbox"
          role="combobox"
        />
        {clearButton && inputVal && (
          <button
            type="button"
            onClick={() => {
              setInputVal('');
              setOpen(true);
              setHi(-1);
              inputRef.current?.focus();
            }}
            className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Clear"
          >
            <X className="h-4 w-4 opacity-60" />
          </button>
        )}
      </label>

      {open && (inputVal.length > 0 || rows.length > 0) && (
        <div
          ref={listRef}
          id="searchcombo-listbox"
          className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="listbox"
        >
          {rows.length === 0 && inputVal.trim() ? (
            <div className="px-3 py-3 text-sm text-zinc-500">
              Press Enter to search “{inputVal.trim()}”
            </div>
          ) : (
            rows.map((row, idx) =>
              row.type === 'header' ? (
                <div
                  key={`hdr-${idx}`}
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400"
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
                  className={[
                    'flex w-full items-center gap-3 px-3 py-2 text-left text-sm',
                    hi === idx
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
                  ].join(' ')}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-zinc-200 dark:ring-zinc-700">
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
