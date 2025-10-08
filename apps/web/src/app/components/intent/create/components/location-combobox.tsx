// components/location/LocationCombo.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import {
  fetchPlaceDetailsFromSuggestion,
  usePlacesAutocomplete,
} from '@/libs/map/usePlacesAutocomplete';

export function LocationCombo({
  value,
  onChangeText,
  onPickPlace,
  bias,
  placeholder = 'Type an address or place…',
  className,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onPickPlace: (place: {
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
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const { suggestions, loading } = usePlacesAutocomplete(value, {
    location: bias?.location,
    radius: bias?.radius,
    includedPrimaryTypes: ['street_address', 'premise', 'route', 'locality'],
    language: 'pl',
    region: 'PL',
  });

  // zamknij na klik poza
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

  const pick = async (idx: number) => {
    const s = suggestions[idx];
    if (!s) return;
    // pobierz szczegóły z nowego API
    const place = await fetchPlaceDetailsFromSuggestion(s.raw, [
      'id',
      'displayName',
      'formattedAddress',
      'location',
    ]);
    onPickPlace({
      id: (place as any).id,
      displayName: (place as any).displayName,
      address: (place as any).formattedAddress,
      lat: (place as any).location?.lat(),
      lng: (place as any).location?.lng(),
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
          onChange={(e) => {
            onChangeText(e.target.value);
            setOpen(true);
            setHighlight(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (highlight >= 0) pick(highlight);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin opacity-60" />}
      </label>

      {open && suggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="listbox"
        >
          {suggestions.map((s, idx) => {
            const active = idx === highlight;
            return (
              <button
                key={idx}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => pick(idx)}
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
          })}
        </div>
      )}
    </div>
  );
}
