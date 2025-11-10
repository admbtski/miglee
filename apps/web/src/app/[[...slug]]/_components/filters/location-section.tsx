'use client';

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MapPin, X } from 'lucide-react';
import { FilterSection } from './filter-section';
import { CITIES } from '@/lib/constants/cities';

type LocationSectionProps = {
  city: string | null;
  distanceKm: number;
  onCityChange: (city: string | null) => void;
  onDistanceChange: (distance: number) => void;
};

export const LocationSection = memo(function LocationSection({
  city,
  distanceKm,
  onCityChange,
  onDistanceChange,
}: LocationSectionProps) {
  const comboboxId = useId();
  const listboxId = `${comboboxId}-listbox`;
  const [cityQuery, setCityQuery] = useState<string>(city ?? '');
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

  const selectCity = useCallback(
    (name: string | null) => {
      onCityChange(name);
      setCityQuery(name ?? '');
      setOpenList(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [onCityChange]
  );

  // Outside click → close list
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

  // Keep highlighted visible
  useEffect(() => {
    if (!openList) return;
    activeOptionRef.current?.scrollIntoView({ block: 'nearest' });
  }, [openList, highlight, cityOptions.length]);

  return (
    <FilterSection
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
              <div className="px-3 py-2 text-sm opacity-60">Brak dopasowań</div>
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
          onChange={(e) => onDistanceChange(Number(e.target.value))}
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
              onClick={() => onDistanceChange(km)}
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
    </FilterSection>
  );
});
