'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  MapPin,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useSearchMeta } from '../hooks/use-search-meta';
import SearchCombo from './search-combo';

const CITIES = [
  { name: 'Kraków', lat: 50.0647, lon: 19.945 },
  { name: 'Warszawa', lat: 52.2297, lon: 21.0122 },
  { name: 'Gdańsk', lat: 54.352, lon: 18.6466 },
  { name: 'Wrocław', lat: 51.1079, lon: 17.0385 },
  { name: 'Poznań', lat: 52.4064, lon: 16.9252 },
] as const;

export type StatusFilter =
  | 'any'
  | 'ongoing'
  | 'started'
  | 'full'
  | 'locked'
  | 'available';
type TypeFilter = 'remote' | 'hybrid' | 'public';
type Level = 'beginner' | 'intermediate' | 'advanced';

export type NextFilters = {
  q: string;
  city: string | null;
  distanceKm: number;
  startISO?: string | null;
  endISO?: string | null;
  status?: StatusFilter;
  types?: TypeFilter[];
  levels?: Level[];
  verifiedOnly?: boolean;
  tags?: string[];
  keywords?: string[];
  categories?: string[];
};

export function FilterModal({
  initialQ,
  initialCity,
  initialDistanceKm,
  initialStartISO = null,
  initialEndISO = null,
  initialStatus = 'any',
  initialTypes = [],
  initialLevels = [],
  initialVerifiedOnly = false,
  initialTags = [],
  initialKeywords = [],
  initialCategories = [],
  resultsCount,
  onApply,
  onClose,
}: {
  initialQ: string;
  initialCity: string | null;
  initialDistanceKm: number;
  initialStartISO?: string | null;
  initialEndISO?: string | null;
  initialStatus?: StatusFilter;
  initialTypes?: TypeFilter[];
  initialLevels?: Level[];
  initialVerifiedOnly?: boolean;
  initialTags?: string[];
  initialKeywords?: string[];
  initialCategories?: string[];
  resultsCount?: number;
  onApply: (next: NextFilters) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState(initialQ ?? '');
  const [city, setCity] = useState<string | null>(initialCity ?? null);
  const [distanceKm, setDistanceKm] = useState<number>(initialDistanceKm ?? 30);
  const [startISO, setStartISO] = useState<string | null>(initialStartISO);
  const [endISO, setEndISO] = useState<string | null>(initialEndISO);
  const [status, setStatus] = useState<StatusFilter>(initialStatus ?? 'any');
  const [types, setTypes] = useState<TypeFilter[]>(initialTypes ?? []);
  const [levels, setLevels] = useState<Level[]>(initialLevels ?? []);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(
    initialVerifiedOnly ?? false
  );

  const [tags, setTags] = useState<string[]>(initialTags ?? []);
  const [keywords, setKeywords] = useState<string[]>(initialKeywords ?? []);
  const [categories, setCategories] = useState<string[]>(
    initialCategories ?? []
  );

  // City autocomplete (simple local)
  const [cityQuery, setCityQuery] = useState<string>(initialCity ?? '');
  const [openList, setOpenList] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const { data, loading } = useSearchMeta(q);

  const cityOptions = useMemo(() => {
    const s = cityQuery.trim().toLowerCase();
    if (!s) return CITIES.map((c) => c.name);
    return CITIES.map((c) => c.name).filter((n) => n.toLowerCase().includes(s));
  }, [cityQuery]);

  const selectCity = useCallback((name: string | null) => {
    setCity(name);
    setCityQuery(name ?? '');
    setOpenList(false);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!inputRef.current?.contains(t) && !listRef.current?.contains(t))
        setOpenList(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const isDirty = useMemo(() => {
    const same =
      q === (initialQ ?? '') &&
      city === (initialCity ?? null) &&
      distanceKm === (initialDistanceKm ?? 30) &&
      (startISO ?? null) === (initialStartISO ?? null) &&
      (endISO ?? null) === (initialEndISO ?? null) &&
      (status ?? 'any') === (initialStatus ?? 'any') &&
      JSON.stringify(types) === JSON.stringify(initialTypes ?? []) &&
      JSON.stringify(levels) === JSON.stringify(initialLevels ?? []) &&
      verifiedOnly === (initialVerifiedOnly ?? false) &&
      JSON.stringify(tags) === JSON.stringify(initialTags ?? []) &&
      JSON.stringify(keywords) === JSON.stringify(initialKeywords ?? []) &&
      JSON.stringify(categories) === JSON.stringify(initialCategories ?? []);
    return !same;
  }, [
    q,
    city,
    distanceKm,
    startISO,
    endISO,
    status,
    types,
    levels,
    verifiedOnly,
    tags,
    keywords,
    categories,
    initialQ,
    initialCity,
    initialDistanceKm,
    initialStartISO,
    initialEndISO,
    initialStatus,
    initialTypes,
    initialLevels,
    initialVerifiedOnly,
    initialTags,
    initialKeywords,
    initialCategories,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter')
        handleApply();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    q,
    city,
    distanceKm,
    startISO,
    endISO,
    status,
    types,
    levels,
    verifiedOnly,
    tags,
    keywords,
    categories,
  ]);

  const handleClear = useCallback(() => {
    setQ('');
    selectCity(null);
    setDistanceKm(30);
    setStartISO(null);
    setEndISO(null);
    setStatus('any');
    setTypes([]);
    setLevels([]);
    setVerifiedOnly(false);
    setTags([]);
    setKeywords([]);
    setCategories([]);
  }, [selectCity]);

  const handleApply = useCallback(
    () =>
      onApply({
        q,
        city,
        distanceKm,
        startISO,
        endISO,
        status,
        types,
        levels,
        verifiedOnly,
        tags,
        keywords,
        categories,
      }),
    [
      q,
      city,
      distanceKm,
      startISO,
      endISO,
      status,
      types,
      levels,
      verifiedOnly,
      tags,
      keywords,
      categories,
      onApply,
    ]
  );

  const chips = useMemo(() => {
    const arr: Array<{ key: string; label: string; onClear: () => void }> = [];
    const push = (key: string, label: string, onClear: () => void) =>
      arr.push({ key, label, onClear });

    if (q) push('q', `Query: ${q}`, () => setQ(''));
    if (city) push('city', city, () => selectCity(null));
    if (city && distanceKm !== 30)
      push('distance', `${distanceKm} km`, () => setDistanceKm(30));
    if (startISO)
      push('start', new Date(startISO).toLocaleString(), () =>
        setStartISO(null)
      );
    if (endISO)
      push('end', new Date(endISO).toLocaleString(), () => setEndISO(null));

    const statusMap: Record<StatusFilter, string> = {
      any: 'Any',
      ongoing: 'Ongoing',
      started: 'Started',
      full: 'Full',
      locked: 'Locked',
      available: 'Available',
    };
    if (status !== 'any')
      push('status', statusMap[status], () => setStatus('any'));

    if (types.length)
      push('types', `Type: ${types.join(', ')}`, () => setTypes([]));
    if (levels.length)
      push('levels', `Level: ${levels.join(', ')}`, () => setLevels([]));
    if (verifiedOnly)
      push('verified', 'Verified only', () => setVerifiedOnly(false));
    if (tags.length)
      push('tags', `Tags: ${tags.join(', ')}`, () => setTags([]));
    if (keywords.length)
      push('keywords', `Keywords: ${keywords.join(', ')}`, () =>
        setKeywords([])
      );
    if (categories.length)
      push('categories', `Categories: ${categories.join(', ')}`, () =>
        setCategories([])
      );

    return arr;
  }, [
    q,
    city,
    distanceKm,
    startISO,
    endISO,
    status,
    types,
    levels,
    verifiedOnly,
    tags,
    keywords,
    categories,
    selectCity,
  ]);

  const Pill = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        'cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 transition',
        active
          ? 'bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white'
          : 'bg-zinc-50 text-zinc-700 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:text-zinc-200 dark:ring-zinc-700',
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-1">
        {active && <Check className="h-3.5 w-3.5" />}
        {children}
      </span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="mx-auto my-6 w-[min(760px,92vw)]">
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10">
            {/* header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-3xl border-b border-zinc-200 bg-white/85 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 ring-1 ring-transparent hover:bg-zinc-100 focus:outline-none focus:ring-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div
                id="filters-title"
                className="flex items-center gap-2 text-base font-medium"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </div>
              <button
                onClick={handleClear}
                className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-600 ring-1 ring-red-100 hover:bg-red-500/15 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20"
              >
                Clear
              </button>
            </div>

            {/* chips */}
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                {chips.map((c) => (
                  <button
                    key={c.key}
                    onClick={c.onClear}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200"
                    title="Remove filter"
                  >
                    <span className="max-w-[12rem] truncate">{c.label}</span>
                    <X className="h-3.5 w-3.5 opacity-60" />
                  </button>
                ))}
              </div>
            )}

            {/* body */}
            <div className="space-y-6 p-4">
              {/* GROUPED SEARCH (async mock) */}
              <SearchCombo
                value={q}
                onChangeValue={setQ}
                onSubmitFreeText={(text) => setQ(text)}
                groups={[
                  {
                    id: 'TAG',
                    label: 'Tags',
                    items: data.tags,
                    selected: tags,
                    onSelect: (t) =>
                      setTags((xs) => (xs.includes(t) ? xs : [...xs, t])),
                  },
                  {
                    id: 'KEYWORD',
                    label: 'Keywords',
                    items: data.keywords,
                    selected: keywords,
                    onSelect: (k) =>
                      setKeywords((xs) => (xs.includes(k) ? xs : [...xs, k])),
                  },
                  {
                    id: 'CATEGORY',
                    label: 'Categories',
                    items: data.categories,
                    selected: categories,
                    onSelect: (c) =>
                      setCategories((xs) => (xs.includes(c) ? xs : [...xs, c])),
                  },
                ]}
                placeholder={
                  loading
                    ? 'Loading suggestions…'
                    : 'Search tags, keywords, or categories…'
                }
              />

              {/* Location */}
              <div className="relative rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-center gap-2 px-1">
                  <MapPin className="h-4 w-4 opacity-60" />
                  <input
                    ref={inputRef}
                    value={cityQuery}
                    onChange={(e) => {
                      setCityQuery(e.target.value);
                      setOpenList(true);
                      setHighlight(0);
                    }}
                    onFocus={() => setOpenList(true)}
                    onKeyDown={(e) => {
                      if (!openList) return;
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlight((h) =>
                          Math.min(h + 1, Math.max(0, cityOptions.length - 1))
                        );
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlight((h) => Math.max(h - 1, 0));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const pick = cityOptions[highlight];
                        if (pick) selectCity(pick);
                      } else if (e.key === 'Escape') {
                        setOpenList(false);
                      }
                    }}
                    placeholder="Location (autocomplete)"
                    className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400"
                  />
                  {cityQuery && (
                    <button
                      onClick={() => {
                        setCityQuery('');
                        selectCity(null);
                        inputRef.current?.focus();
                        setOpenList(true);
                      }}
                      className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      aria-label="Clear location"
                    >
                      <X className="h-4 w-4 opacity-60" />
                    </button>
                  )}
                </div>

                {openList && cityOptions.length > 0 && (
                  <div
                    ref={listRef}
                    role="listbox"
                    className="absolute left-0 right-0 z-20 mt-2 max-h-60 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {cityOptions.map((name, idx) => {
                      const active = idx === highlight;
                      return (
                        <button
                          key={name}
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setHighlight(idx)}
                          onClick={() => selectCity(name)}
                          className={[
                            'block w-full cursor-pointer px-3 py-2 text-left text-sm',
                            active
                              ? 'bg-zinc-100 dark:bg-zinc-800'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
                          ].join(' ')}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Distance */}
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Distance</span>
                  <span className="tabular-nums text-sm text-zinc-700 dark:text-zinc-200">
                    {distanceKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>

              {/* Date range */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <CalendarIcon className="h-4 w-4" />
                  Date range
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                    <span className="w-20 shrink-0 text-zinc-500">Start</span>
                    <input
                      type="datetime-local"
                      value={startISO ?? ''}
                      onChange={(e) => setStartISO(e.target.value || null)}
                      className="w-full bg-transparent outline-none"
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                    <span className="w-20 shrink-0 text-zinc-500">End</span>
                    <input
                      type="datetime-local"
                      value={endISO ?? ''}
                      onChange={(e) => setEndISO(e.target.value || null)}
                      className="w-full bg-transparent outline-none"
                    />
                  </label>
                </div>
              </div>

              {/* Status */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-2 text-sm font-medium">Status</div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      'any',
                      'ongoing',
                      'started',
                      'full',
                      'locked',
                      'available',
                    ] as const
                  ).map((val) => (
                    <Pill
                      key={val}
                      active={status === val}
                      onClick={() => setStatus(val)}
                    >
                      {val[0].toUpperCase() + val.slice(1)}
                    </Pill>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-2 text-sm font-medium">Type</div>
                <div className="flex flex-wrap gap-2">
                  {(['remote', 'hybrid', 'public'] as const).map((t) => {
                    const active = types.includes(t);
                    return (
                      <Pill
                        key={t}
                        active={active}
                        onClick={() =>
                          setTypes((curr) =>
                            active ? curr.filter((x) => x !== t) : [...curr, t]
                          )
                        }
                      >
                        {t}
                      </Pill>
                    );
                  })}
                </div>
              </div>

              {/* Level */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-2 text-sm font-medium">Level</div>
                <div className="flex flex-wrap gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(
                    (lv) => {
                      const active = levels.includes(lv);
                      return (
                        <Pill
                          key={lv}
                          active={active}
                          onClick={() =>
                            setLevels((curr) =>
                              active
                                ? curr.filter((x) => x !== lv)
                                : [...curr, lv]
                            )
                          }
                        >
                          {lv[0].toUpperCase() + lv.slice(1)}
                        </Pill>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Verified */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-2 text-sm font-medium">Organizer</div>
                <label className="inline-flex cursor-pointer select-none items-center gap-3 text-sm text-zinc-800 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                  />
                  <span
                    className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${verifiedOnly ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${verifiedOnly ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </span>
                  Verified only
                </label>
              </div>
            </div>

            {/* footer */}
            <div className="sticky bottom-0 rounded-b-3xl border-t border-zinc-200 bg-gradient-to-t from-white via-white/95 p-4 backdrop-blur dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/95">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={!isDirty}
                  className="rounded-xl bg-zinc-900 px-5 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600"
                  title={isDirty ? 'Apply' : 'No changes'}
                >
                  {resultsCount != null
                    ? `Show results (${resultsCount})`
                    : 'Show results'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
