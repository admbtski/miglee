'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import {
  fetchPlaceDetailsFromSuggestion,
  usePlacesAutocomplete,
} from '@/features/maps/hooks/use-places-autocomplete';

export function LocationCombo({
  value,
  onChangeText,
  onPickPlace,
  bias,
  placeholder = 'Type an address or place…',
  className,
  loadingOverride,
  includedPrimaryTypes,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onPickPlace: (place: {
    /** Google Place ID */
    placeId?: string;
    /** Alias (for backward-compatibility – equal to placeId) */
    id?: string;
    address?: string;
    lat?: number;
    lng?: number;
    displayName?: string;
  }) => void;
  bias?: {
    location?: google.maps.LatLngLiteral;
    radius?: number;
  };
  placeholder?: string;
  className?: string;
  loadingOverride?: boolean;
  includedPrimaryTypes?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const trimmed = value.trim();
  const { suggestions, loading, error } = usePlacesAutocomplete(trimmed, {
    location: bias?.location,
    radius: bias?.radius,
    includedPrimaryTypes: includedPrimaryTypes || [
      'street_address',
      'premise',
      'route',
      'locality',
    ],
    language: 'pl',
    region: 'PL',
  });

  console.dir({ trimmed, suggestions, loading, error });

  const isLoading = loadingOverride ?? loading;

  const openPanel = () => setOpen(true);

  // Close on outside click (pointerdown + composedPath)
  useEffect(() => {
    const onDoc = (e: Event) => {
      const path = (e as any).composedPath?.() as Node[] | undefined;
      const t = (e.target as Node) || null;
      const insideInput =
        (path && inputRef.current
          ? path.includes(inputRef.current)
          : inputRef.current?.contains(t)) || false;
      const insideList =
        (path && listRef.current
          ? path.includes(listRef.current)
          : listRef.current?.contains(t)) || false;
      if (!insideInput && !insideList) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, []);

  // Preselect first item when panel opens and results arrive
  useEffect(() => {
    if (open && highlight < 0 && suggestions.length > 0) {
      setHighlight(0);
    }
  }, [open, suggestions, highlight]);

  const pick = async (idx: number) => {
    const s = suggestions[idx];
    if (!s) return;

    const place = await fetchPlaceDetailsFromSuggestion(s.raw, [
      'id',
      'displayName',
      'formattedAddress',
      'location',
    ]);

    if (!place) return;

    const predictionPlaceId = s.raw.placePrediction?.placeId;
    const placeId = place.placeId || place.id || predictionPlaceId || undefined;

    onPickPlace({
      placeId,
      id: placeId,
      displayName: place.displayName,
      address: place.formattedAddress,
      lat: place.lat,
      lng: place.lng,
    });

    setOpen(false);
    setHighlight(-1);
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
        <MapPin className="h-4 w-4 opacity-60" />
        <input
          ref={inputRef}
          value={value}
          onFocus={openPanel}
          onChange={(e) => {
            onChangeText(e.target.value);
            openPanel();
            setHighlight(-1);
          }}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight((h) =>
                Math.min(h + 1, Math.max(0, suggestions.length - 1))
              );
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (highlight >= 0) void pick(highlight);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="place-suggestions"
          role="combobox"
        />
        {isLoading && (
          <Loader2
            className="h-4 w-4 animate-spin opacity-60"
            aria-label="Loading"
          />
        )}
      </label>

      {open && (
        <div
          ref={listRef}
          id="place-suggestions"
          className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="listbox"
          aria-label="Places"
        >
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin opacity-60" />
              Searching…
            </div>
          ) : suggestions.length === 0 ? (
            trimmed ? (
              <div className="px-3 py-2 text-sm text-zinc-500">
                No matches. Keep typing…
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-zinc-500">
                Start typing to search places
              </div>
            )
          ) : (
            suggestions.map((s, idx) => {
              const active = idx === highlight;
              const pid = s.raw.placePrediction?.placeId;
              return (
                <button
                  key={pid ?? `${s.text}-${idx}`}
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void pick(idx)}
                  className={[
                    'block w-full cursor-pointer px-3 py-2 text-left text-sm',
                    active
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
                  ].join(' ')}
                >
                  {s.text}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
