'use client';

import {
  IntentStatus,
  Level,
  MeetingKind,
} from '@/lib/api/__generated__/react-query-update';
import { AlertCircle, MapPin, SlidersHorizontal, X } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { SearchMeta, useSearchMeta } from '../_hooks/use-search-meta';
import SearchCombo from './search-combo';
import { INTENTS_CONFIG } from '@/lib/constants/intents';
import { CITIES } from '@/lib/constants/cities';
import {
  isoToLocalInput,
  localInputToISO,
  dateToISO,
  normalizeISO,
} from '@/lib/utils/date';
import { Pill } from '@/components/ui/pill';
import { Section } from '@/components/ui/section';
import { ErrorBoundary } from '@/components/feedback/error-boundary';

// Note: FilterSection, FilterPill, FilterChips, LocationSection, DateRangeSection
// components are available in ./filters/ for future refactoring

/* ────────────────────────────────────────────────────────────────────────── */
/* constants & helpers */
/* ────────────────────────────────────────────────────────────────────────── */

const DEFAULT_DISTANCE = INTENTS_CONFIG.DEFAULT_DISTANCE_KM;

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
  const [keywords, setKeywords] = useState<string[]>(initialKeywords ?? []);
  const [categories, setCategories] = useState<SearchMeta['categories']>([]);
  const [tags, setTags] = useState<SearchMeta['tags']>([]);

  /* meta - for search suggestions */
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
      tags: tags.map((t) => t.slug),
      keywords,
      categories: categories.map((c) => c.slug),
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
    const sameTags = arraysEq(
      tags.map((t) => t.slug),
      initialTags ?? []
    );
    const sameKeywords = arraysEq(keywords, initialKeywords ?? []);
    const sameCategories = arraysEq(
      categories.map((c) => c.slug),
      initialCategories ?? []
    );
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

    if (q) push('q', `Szukaj: “${q}”`, () => setQ(''));
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
      push('status', `Status: ${status}`, () => setStatus(IntentStatus.Any));
    if (kinds.length)
      push('kinds', `Tryb: ${kinds.join(', ')}`, () => setKinds([]));
    if (levels.length)
      push('levels', `Poziom: ${levels.join(', ')}`, () => setLevels([]));
    if (verifiedOnly)
      push('verified', 'Zweryfikowani', () => setVerifiedOnly(false));
    if (tags.length)
      push('tags', `Tagi: ${tags.map((t) => t.label).join(', ')}`, () =>
        setTags([])
      );
    if (keywords.length)
      push('keywords', `Słowa kluczowe: ${keywords.join(', ')}`, () =>
        setKeywords([])
      );
    if (categories.length)
      push(
        'categories',
        `Kategorie: ${categories.map((c) => c.label).join(', ')}`,
        () => setCategories([])
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

  /* inputs helpers (render lokalny format dla datetime-local) */
  const startForInput = useMemo(() => isoToLocalInput(startISO), [startISO]);
  const endForInput = useMemo(() => isoToLocalInput(endISO), [endISO]);
  const endMin = startForInput || undefined;

  /* presets: date range (liczone lokalnie, zapisywane jako ISO/UTC do stanu) */
  const applyPreset = useCallback(
    (preset: 'now1h' | 'tonight' | 'tomorrow' | 'weekend' | '7days') => {
      const now = new Date();
      const start = new Date(now);
      const end = new Date(now);

      switch (preset) {
        case 'now1h': {
          end.setHours(end.getHours() + 1);
          break;
        }
        case 'tonight': {
          // 18:00–22:00 dzisiaj, jeśli już po 22, to jutro 18–22
          const base = new Date(now);
          if (base.getHours() >= 22) base.setDate(base.getDate() + 1);
          base.setHours(18, 0, 0, 0);
          start.setTime(base.getTime());
          const e = new Date(base);
          e.setHours(22, 0, 0, 0);
          end.setTime(e.getTime());
          break;
        }
        case 'tomorrow': {
          const t = new Date(now);
          t.setDate(t.getDate() + 1);
          t.setHours(9, 0, 0, 0);
          start.setTime(t.getTime());
          const e = new Date(t);
          e.setHours(21, 0, 0, 0);
          end.setTime(e.getTime());
          break;
        }
        case 'weekend': {
          // najbliższa sobota 10:00 → niedziela 22:00
          const d = new Date(now);
          const day = d.getDay(); // 0=nd, 6=sb
          const deltaToSat =
            (6 - day + 7) % 7 || (day === 6 && d.getHours() < 10 ? 0 : 7);
          const sat = new Date(d);
          sat.setDate(d.getDate() + deltaToSat);
          sat.setHours(10, 0, 0, 0);
          const sun = new Date(sat);
          sun.setDate(sat.getDate() + 1);
          sun.setHours(22, 0, 0, 0);
          start.setTime(sat.getTime());
          end.setTime(sun.getTime());
          break;
        }
        case '7days': {
          const s = new Date(now);
          s.setHours(0, 0, 0, 0);
          const e = new Date(s);
          e.setDate(e.getDate() + 7);
          e.setHours(23, 59, 0, 0);
          start.setTime(s.getTime());
          end.setTime(e.getTime());
          break;
        }
      }

      // zapis w stanie jako ISO (UTC) – inputy pokażą lokalny czas dzięki isoToLocalInput
      setStartISO(dateToISO(start));
      setEndISO(dateToISO(end));
    },
    []
  );

  /* ──────────────────────────────────────────────────────────────────────── */
  /* render */
  /* ──────────────────────────────────────────────────────────────────────── */

  const applyDisabled = !isDirty || !!dateError;

  return (
    <ErrorBoundary>
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
          <div className="mx-auto my-6 w-[min(780px,92vw)]">
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
                  Filtry wyszukiwania
                </div>
                <button
                  onClick={handleClear}
                  disabled={!isDirty}
                  className="px-3 py-1 text-sm font-medium rounded-full ring-1 disabled:opacity-40 disabled:cursor-not-allowed
                bg-red-500/10 text-red-600 ring-red-100 hover:bg-red-500/15 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20"
                  title={
                    isDirty
                      ? 'Wyczyść wszystkie'
                      : 'Brak zmian do wyczyszczenia'
                  }
                >
                  Wyczyść
                </button>
              </div>

              {/* chips */}
              {chips.length > 0 && (
                <div className="px-4 pt-3">
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {chips.map((c) => (
                      <button
                        key={c.key}
                        onClick={c.onClear}
                        className="inline-flex items-center gap-2 px-3 py-1 text-sm border rounded-full border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200"
                        title="Usuń filtr"
                      >
                        <span className="truncate max-w-[14rem]">
                          {c.label}
                        </span>
                        <X className="h-3.5 w-3.5 opacity-60" />
                      </button>
                    ))}
                  </div>
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
                      label: 'Tagi',
                      items: data.tags,
                      selected: tags,
                      onSelect: (c) =>
                        setTags((xs) =>
                          xs.some((x) => x.slug === c.slug) ? xs : [...xs, c]
                        ),
                    },
                    {
                      id: 'CATEGORY',
                      label: 'Kategorie',
                      items: data.categories,
                      selected: categories,
                      onSelect: (c) =>
                        setCategories((xs) =>
                          xs.some((x) => x.slug === c.slug) ? xs : [...xs, c]
                        ),
                    },
                  ]}
                  placeholder={
                    loading
                      ? 'Ładowanie podpowiedzi…'
                      : 'Szukaj tagów lub kategorii…'
                  }
                />

                {/* Location combobox */}
                <Section
                  title="Lokalizacja"
                  hint="Wybierz miasto, aby filtrować po odległości."
                >
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
                              Math.min(
                                h + 1,
                                Math.max(0, cityOptions.length - 1)
                              )
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
                        placeholder="Miasto (autocomplete)"
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
                          aria-label="Wyczyść lokalizację"
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

                  {/* Distance + presets */}
                  <div
                    aria-disabled={!city}
                    className={[
                      'mt-3 px-3 py-2 bg-white border rounded-2xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900',
                      !city ? 'opacity-50' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Odległość</span>
                      <span className="text-sm tabular-nums text-zinc-700 dark:text-zinc-200">
                        {city ? `${distanceKm} km` : 'Globalnie'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(Number(e.target.value))}
                      className="w-full mt-2 accent-indigo-600 disabled:opacity-50"
                      aria-label="Odległość w kilometrach"
                      disabled={!city}
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[5, 10, 20, 30, 50, 100].map((km) => (
                        <button
                          key={km}
                          type="button"
                          disabled={!city}
                          onClick={() => setDistanceKm(km)}
                          className={[
                            'rounded-full px-2 py-0.5 text-xs ring-1',
                            distanceKm === km
                              ? 'bg-indigo-600 text-white ring-indigo-600'
                              : 'bg-zinc-50 text-zinc-700 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:text-zinc-200 dark:ring-zinc-700',
                            !city ? 'opacity-60' : '',
                          ].join(' ')}
                          aria-label={`Ustaw ${km} km`}
                        >
                          {km} km
                        </button>
                      ))}
                    </div>
                  </div>
                </Section>

                {/* Date range */}
                <Section
                  title="Zakres dat"
                  hint="Skorzystaj z presetów lub ustaw własny zakres."
                >
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { id: 'now1h', label: 'Teraz +1h' },
                      { id: 'tonight', label: 'Dziś wieczorem' },
                      { id: 'tomorrow', label: 'Jutro' },
                      { id: 'weekend', label: 'Weekend' },
                      { id: '7days', label: 'Najbliższe 7 dni' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          applyPreset(
                            p.id as
                              | 'now1h'
                              | 'tonight'
                              | 'tomorrow'
                              | 'weekend'
                              | '7days'
                          )
                        }
                        className="rounded-full px-2.5 py-1 text-xs ring-1 bg-zinc-50 text-zinc-700 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:text-zinc-200 dark:ring-zinc-700"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
                      <span className="w-20 shrink-0 text-zinc-500">Start</span>
                      <input
                        type="datetime-local"
                        value={startForInput}
                        onChange={(e) =>
                          setStartISO(localInputToISO(e.target.value))
                        }
                        className="w-full bg-transparent outline-none"
                      />
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900">
                      <span className="w-20 shrink-0 text-zinc-500">
                        Koniec
                      </span>
                      <input
                        type="datetime-local"
                        value={endForInput}
                        min={endMin}
                        onChange={(e) =>
                          setEndISO(localInputToISO(e.target.value))
                        }
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
                </Section>

                {/* Status */}
                <Section title="Status">
                  <div className="flex flex-wrap gap-2">
                    {[
                      IntentStatus.Any,
                      IntentStatus.Available,
                      IntentStatus.Ongoing,
                      IntentStatus.Full,
                      IntentStatus.Locked,
                      IntentStatus.Past,
                      IntentStatus.Locked,
                    ].map((val) => (
                      <Pill
                        key={val}
                        active={status === val}
                        onClick={() => setStatus(val)}
                        title={`Filtruj: ${val}`}
                      >
                        {val}
                      </Pill>
                    ))}
                  </div>
                </Section>

                {/* Kinds */}
                <Section title="Tryb spotkania">
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
                              active
                                ? curr.filter((x) => x !== t)
                                : [...curr, t]
                            )
                          }
                          title={`Przełącz: ${t}`}
                        >
                          {t}
                        </Pill>
                      );
                    })}
                  </div>
                </Section>

                {/* Level */}
                <Section title="Poziom">
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
                            title={`Przełącz: ${lv}`}
                          >
                            {lv}
                          </Pill>
                        );
                      }
                    )}
                  </div>
                </Section>

                {/* Verified */}
                <Section
                  title="Organizator"
                  hint="Pokaż tylko zweryfikowanych organizatorów."
                >
                  <label className="inline-flex items-center gap-3 text-sm cursor-pointer select-none text-zinc-800 dark:text-zinc-200">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      aria-label="Tylko zweryfikowani organizatorzy"
                    />
                    <span
                      className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${verifiedOnly ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full bg-white transition-transform ${verifiedOnly ? 'translate-x-4' : 'translate-x-0'}`}
                      />
                    </span>
                    Tylko zweryfikowani
                  </label>
                </Section>
              </div>

              {/* footer */}
              <div className="sticky bottom-0 p-4 border-t rounded-b-3xl border-zinc-200 bg-gradient-to-t from-white via-white/95 backdrop-blur dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/95">
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="text-sm text-zinc-600 dark:text-zinc-400"
                    aria-live="polite"
                  >
                    {resultsCount != null
                      ? `${resultsCount} wynik${resultsCount === 1 ? '' : 'ów'}`
                      : '—'}
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm border rounded-xl border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={applyDisabled}
                      className="px-5 py-2 text-sm font-medium text-white shadow-sm rounded-xl bg-zinc-900 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600"
                      title={
                        applyDisabled
                          ? dateError
                            ? dateError
                            : 'Brak zmian'
                          : 'Zastosuj'
                      }
                    >
                      {resultsCount != null
                        ? `Pokaż wyniki (${resultsCount})`
                        : 'Pokaż wyniki'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
