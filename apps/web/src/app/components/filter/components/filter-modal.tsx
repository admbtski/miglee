'use client';

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  memo,
} from 'react';
import {
  IntentStatus,
  Level,
  MeetingKind,
} from '@/libs/graphql/__generated__/react-query-update';
import {
  Calendar as CalendarIcon,
  Check,
  MapPin,
  SlidersHorizontal,
  X,
  AlertCircle,
} from 'lucide-react';
import { useSearchMeta } from '../hooks/use-search-meta';
import SearchCombo from './search-combo';

/* ────────────────────────────────────────────────────────────────────────── */
/* constants & helpers */
/* ────────────────────────────────────────────────────────────────────────── */

const CITIES = [
  { name: 'Kraków', lat: 50.0647, lon: 19.945 },
  { name: 'Warszawa', lat: 52.2297, lon: 21.0122 },
  { name: 'Gdańsk', lat: 54.352, lon: 18.6466 },
  { name: 'Wrocław', lat: 51.1079, lon: 17.0385 },
  { name: 'Poznań', lat: 52.4064, lon: 16.9252 },
] as const;

const DEFAULT_DISTANCE = 30;

export type NextFilters = {
  q: string;
  city: string | null;
  distanceKm: number;
  startISO?: string | null;
  endISO?: string | null;
  status?: IntentStatus;
  kinds?: MeetingKind[];
  levels?: Level[];
  verifiedOnly?: boolean;
  tags?: string[];
  keywords?: string[];
  categories?: string[];
};

type Props = {
  initialQ: string;
  initialCity: string | null;
  initialDistanceKm: number;
  initialStartISO?: string | null;
  initialEndISO?: string | null;
  initialStatus?: IntentStatus;
  initialKinds?: MeetingKind[];
  initialLevels?: Level[];
  initialVerifiedOnly?: boolean;
  initialTags?: string[];
  initialKeywords?: string[];
  initialCategories?: string[];
  resultsCount?: number;
  onApply: (next: NextFilters) => void;
  onClose: () => void;
};

const arraysEq = <T,>(a?: readonly T[], b?: readonly T[]) => {
  if (a === b) return true;
  const aa = a ?? [];
  const bb = b ?? [];
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return false;
  return true;
};

const normalizeISO = (v?: string | null) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/* ────────────────────────────────────────────────────────────────────────── */
/* UI atoms */
/* ────────────────────────────────────────────────────────────────────────── */

const Pill = memo(function Pill({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
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
});

/* ────────────────────────────────────────────────────────────────────────── */
/* component */
/* ────────────────────────────────────────────────────────────────────────── */

export function FilterModal({
  initialQ,
  initialCity,
  initialDistanceKm,
  initialStartISO = null,
  initialEndISO = null,
  initialStatus = IntentStatus.Any,
  initialKinds = [],
  initialLevels = [],
  initialVerifiedOnly = false,
  initialTags = [],
  initialKeywords = [],
  initialCategories = [],
  resultsCount,
  onApply,
  onClose,
}: Props) {
  /* state */
  const [q, setQ] = useState<string>(initialQ ?? '');
  const [city, setCity] = useState<string | null>(initialCity ?? null);
  const [distanceKm, setDistanceKm] = useState<number>(
    initialDistanceKm ?? DEFAULT_DISTANCE
  );
  const [startISO, setStartISO] = useState<string | null>(initialStartISO);
  const [endISO, setEndISO] = useState<string | null>(initialEndISO);
  const [status, setStatus] = useState<IntentStatus>(
    initialStatus ?? IntentStatus.Any
  );
  const [kinds, setKinds] = useState<MeetingKind[]>(initialKinds ?? []);
  const [levels, setLevels] = useState<Level[]>(initialLevels ?? []);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(
    initialVerifiedOnly ?? false
  );
  const [tags, setTags] = useState<string[]>(initialTags ?? []);
  const [keywords, setKeywords] = useState<string[]>(initialKeywords ?? []);
  const [categories, setCategories] = useState<string[]>(
    initialCategories ?? []
  );

  /* meta */
  const { data, loading } = useSearchMeta(q);

  /* combobox: city */
  const comboboxId = useId();
  const listboxId = `${comboboxId}-listbox`;
  const [cityQuery, setCityQuery] = useState<string>(initialCity ?? '');
  const [openList, setOpenList] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const activeOptionRef = useRef<HTMLButtonElement | null>(null);

  const cityOptions = useMemo(() => {
    const s = cityQuery.trim().toLowerCase();
    const base = CITIES.map((c) => c.name);
    if (!s) return base;
    return base.filter((n) => n.toLowerCase().includes(s));
  }, [cityQuery]);

  const selectCity = useCallback((name: string | null) => {
    setCity(name);
    setCityQuery(name ?? '');
    setOpenList(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  /* outside click → close list */
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!inputRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpenList(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  /* keep highlighted visible */
  useEffect(() => {
    if (!openList) return;
    activeOptionRef.current?.scrollIntoView({ block: 'nearest' });
  }, [openList, highlight, cityOptions.length]);

  /* validation: date range */
  const dateError = useMemo(() => {
    if (!startISO || !endISO) return null;
    const s = new Date(startISO).getTime();
    const e = new Date(endISO).getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) return 'Nieprawidłowy format daty.';
    if (e < s)
      return 'Data zakończenia nie może być wcześniejsza niż rozpoczęcia.';
    return null;
  }, [startISO, endISO]);

  /* apply */
  const handleApply = useCallback(() => {
    const startIsoNorm = normalizeISO(startISO);
    const endIsoNorm = normalizeISO(endISO);
    onApply({
      q,
      city,
      distanceKm,
      startISO: startIsoNorm,
      endISO: endIsoNorm,
      status,
      kinds,
      levels,
      verifiedOnly,
      tags,
      keywords,
      categories,
    });
  }, [
    categories,
    city,
    distanceKm,
    endISO,
    kinds,
    keywords,
    levels,
    onApply,
    q,
    startISO,
    status,
    tags,
    verifiedOnly,
  ]);

  /* global shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') {
        e.preventDefault();
        handleApply();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleApply, onClose]);

  /* clear */
  const handleClear = useCallback(() => {
    setQ('');
    selectCity(null);
    setDistanceKm(DEFAULT_DISTANCE);
    setStartISO(null);
    setEndISO(null);
    setStatus(IntentStatus.Any);
    setKinds([]);
    setLevels([]);
    setVerifiedOnly(false);
    setTags([]);
    setKeywords([]);
    setCategories([]);
  }, [selectCity]);

  /* dirty check */
  const isDirty = useMemo(() => {
    const sameQ = q === (initialQ ?? '');
    const sameCity = city === (initialCity ?? null);
    const sameDist = distanceKm === (initialDistanceKm ?? DEFAULT_DISTANCE);
    const sameStart = (startISO ?? null) === (initialStartISO ?? null);
    const sameEnd = (endISO ?? null) === (initialEndISO ?? null);
    const sameStatus =
      (status ?? IntentStatus.Any) === (initialStatus ?? IntentStatus.Any);
    const sameKinds = arraysEq(kinds, initialKinds ?? []);
    const sameLevels = arraysEq(levels, initialLevels ?? []);
    const sameVerified = verifiedOnly === (initialVerifiedOnly ?? false);
    const sameTags = arraysEq(tags, initialTags ?? []);
    const sameKeywords = arraysEq(keywords, initialKeywords ?? []);
    const sameCategories = arraysEq(categories, initialCategories ?? []);
    return !(
      sameQ &&
      sameCity &&
      sameDist &&
      sameStart &&
      sameEnd &&
      sameStatus &&
      sameKinds &&
      sameLevels &&
      sameVerified &&
      sameTags &&
      sameKeywords &&
      sameCategories
    );
  }, [
    q,
    city,
    distanceKm,
    startISO,
    endISO,
    status,
    kinds,
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
    initialKinds,
    initialLevels,
    initialVerifiedOnly,
    initialTags,
    initialKeywords,
    initialCategories,
  ]);

  /* chips */
  const chips = useMemo(() => {
    const arr: Array<{ key: string; label: string; onClear: () => void }> = [];
    const push = (key: string, label: string, onClear: () => void) =>
      arr.push({ key, label, onClear });

    if (q) push('q', `Query: ${q}`, () => setQ(''));
    if (city) push('city', city, () => selectCity(null));
    if (city && distanceKm !== DEFAULT_DISTANCE)
      push('distance', `${distanceKm} km`, () =>
        setDistanceKm(DEFAULT_DISTANCE)
      );
    if (startISO)
      push('start', new Date(startISO).toLocaleString(), () =>
        setStartISO(null)
      );
    if (endISO)
      push('end', new Date(endISO).toLocaleString(), () => setEndISO(null));
    if (status !== IntentStatus.Any)
      push('status', status, () => setStatus(IntentStatus.Any));
    if (kinds.length)
      push('kinds', `Kinds: ${kinds.join(', ')}`, () => setKinds([]));
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
    kinds,
    levels,
    verifiedOnly,
    tags,
    keywords,
    categories,
    selectCity,
  ]);

  /* inputs helpers */
  const startForInput = startISO ?? '';
  const endForInput = endISO ?? '';
  const endMin = startISO ?? undefined;

  /* ──────────────────────────────────────────────────────────────────────── */
  /* render */
  /* ──────────────────────────────────────────────────────────────────────── */

  const applyDisabled = !isDirty || !!dateError;

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
          <div className="bg-white border shadow-2xl rounded-3xl border-zinc-200 ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10">
            {/* header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-4 border-b rounded-t-3xl border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-zinc-600 ring-1 ring-transparent hover:bg-zinc-100 focus:outline-none focus:ring-indigo-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div
                id="filters-title"
                className="flex items-center gap-2 text-base font-medium"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </div>
              <button
                onClick={handleClear}
                className="px-3 py-1 text-sm font-medium text-red-600 rounded-full bg-red-500/10 ring-1 ring-red-100 hover:bg-red-500/15 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20"
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
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm border rounded-full border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200"
                    title="Remove filter"
                  >
                    <span className="max-w-[12rem] truncate">{c.label}</span>
                    <X className="h-3.5 w-3.5 opacity-60" />
                  </button>
                ))}
              </div>
            )}

            {/* body */}
            <div className="p-4 space-y-6">
              {/* GROUPED SEARCH */}
              <SearchCombo
                value={q}
                onChangeValue={setQ}
                onSubmitFreeText={setQ}
                loading={loading}
                groups={[
                  {
                    id: 'TAG',
                    label: 'Tags',
                    items: data.tags,
                    selected: tags,
                    onSelect: (t: string) =>
                      setTags((xs) => (xs.includes(t) ? xs : [...xs, t])),
                  },
                  {
                    id: 'KEYWORD',
                    label: 'Keywords',
                    items: data.keywords,
                    selected: keywords,
                    onSelect: (k: string) =>
                      setKeywords((xs) => (xs.includes(k) ? xs : [...xs, k])),
                  },
                  {
                    id: 'CATEGORY',
                    label: 'Categories',
                    items: data.categories,
                    selected: categories,
                    onSelect: (c: string) =>
                      setCategories((xs) => (xs.includes(c) ? xs : [...xs, c])),
                  },
                ]}
                placeholder={
                  loading
                    ? 'Loading suggestions…'
                    : 'Search tags, keywords, or categories…'
                }
              />

              {/* Location combobox */}
              <div className="relative p-2 bg-white border rounded-2xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-center gap-2 px-1">
                  <MapPin className="w-4 h-4 opacity-60" />
                  <input
                    ref={inputRef}
                    role="combobox"
                    aria-controls={listboxId}
                    aria-expanded={openList}
                    aria-autocomplete="list"
                    aria-activedescendant={
                      openList && cityOptions[highlight]
                        ? `${listboxId}-opt-${highlight}`
                        : undefined
                    }
                    id={comboboxId}
                    value={cityQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCityQuery(v);
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
                    className="w-full py-2 text-sm bg-transparent outline-none placeholder:text-zinc-400"
                  />
                  {cityQuery && (
                    <button
                      onClick={() => {
                        setCityQuery('');
                        selectCity(null);
                        setOpenList(true);
                      }}
                      className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      aria-label="Clear location"
                    >
                      <X className="w-4 h-4 opacity-60" />
                    </button>
                  )}
                </div>

                {openList && (
                  <div
                    ref={listRef}
                    id={listboxId}
                    role="listbox"
                    className="absolute left-0 right-0 z-20 mt-2 overflow-auto bg-white border shadow-lg max-h-60 rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {cityOptions.length === 0 ? (
                      <div className="px-3 py-2 text-sm opacity-60">
                        Brak dopasowań
                      </div>
                    ) : (
                      cityOptions.map((name, idx) => {
                        const active = idx === highlight;
                        return (
                          <button
                            key={name}
                            id={`${listboxId}-opt-${idx}`}
                            ref={active ? activeOptionRef : null}
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
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Distance */}
              <div className="px-3 py-2 bg-white border rounded-2xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Distance</span>
                  <span className="text-sm tabular-nums text-zinc-700 dark:text-zinc-200">
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
                  className="w-full mt-2 accent-indigo-600"
                  aria-label="Distance in kilometers"
                />
              </div>

              {/* Date range */}
              <div className="p-3 bg-white border rounded-2xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <CalendarIcon className="w-4 h-4" />
                  Date range
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
                    <span className="w-20 shrink-0 text-zinc-500">Start</span>
                    <input
                      type="datetime-local"
                      value={startForInput}
                      onChange={(e) => setStartISO(e.target.value || null)}
                      className="w-full bg-transparent outline-none"
                    />
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
                    <span className="w-20 shrink-0 text-zinc-500">End</span>
                    <input
                      type="datetime-local"
                      value={endForInput}
                      min={endMin ?? undefined}
                      onChange={(e) => setEndISO(e.target.value || null)}
                      className="w-full bg-transparent outline-none"
                    />
                  </label>
                </div>

                {dateError && (
                  <p className="inline-flex items-center gap-2 mt-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    {dateError}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="p-3 bg-white border rounded-2xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-2 text-sm font-medium">Status</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    IntentStatus.Any,
                    IntentStatus.Ongoing,
                    IntentStatus.Started,
                    IntentStatus.Full,
                    IntentStatus.Locked,
                    IntentStatus.Available,
                  ].map((val) => (
                    <Pill
                      key={val}
                      active={status === val}
                      onClick={() => setStatus(val)}
                      title={`Filter by ${val}`}
                    >
                      {val}
                    </Pill>
                  ))}
                </div>
              </div>

              {/* Kinds */}
              <div className="p-3 bg-white border rounded-2xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-2 text-sm font-medium">Kinds</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    MeetingKind.Onsite,
                    MeetingKind.Online,
                    MeetingKind.Hybrid,
                  ].map((t) => {
                    const active = kinds.includes(t);
                    return (
                      <Pill
                        key={t}
                        active={active}
                        onClick={() =>
                          setKinds((curr) =>
                            active ? curr.filter((x) => x !== t) : [...curr, t]
                          )
                        }
                        title={`Toggle ${t}`}
                      >
                        {t}
                      </Pill>
                    );
                  })}
                </div>
              </div>

              {/* Level */}
              <div className="p-3 bg-white border rounded-2xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-2 text-sm font-medium">Level</div>
                <div className="flex flex-wrap gap-2">
                  {[Level.Beginner, Level.Intermediate, Level.Advanced].map(
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
                          title={`Toggle ${lv}`}
                        >
                          {lv}
                        </Pill>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Verified */}
              <div className="p-3 bg-white border rounded-2xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-2 text-sm font-medium">Organizer</div>
                <label className="inline-flex items-center gap-3 text-sm cursor-pointer select-none text-zinc-800 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    aria-label="Verified organizers only"
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
            <div className="sticky bottom-0 p-4 border-t rounded-b-3xl border-zinc-200 bg-gradient-to-t from-white via-white/95 backdrop-blur dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/95">
              <div className="flex items-center justify-between gap-3">
                {resultsCount != null && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {resultsCount} wynik{resultsCount === 1 ? '' : 'ów'}
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm border rounded-xl border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={applyDisabled}
                    className="px-5 py-2 text-sm font-medium text-white shadow-sm rounded-xl bg-zinc-900 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600"
                    title={
                      applyDisabled
                        ? dateError
                          ? dateError
                          : 'No changes'
                        : 'Apply'
                    }
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
    </div>
  );
}
