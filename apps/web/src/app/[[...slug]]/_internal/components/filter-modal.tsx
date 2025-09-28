'use client';

import { MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

// ===== Mock / demo data =====
const CITIES = [
  { name: 'Kraków', lat: 50.0647, lon: 19.945 },
  { name: 'Warszawa', lat: 52.2297, lon: 21.0122 },
  { name: 'Gdańsk', lat: 54.352, lon: 18.6466 },
  { name: 'Wrocław', lat: 51.1079, lon: 17.0385 },
  { name: 'Poznań', lat: 52.4064, lon: 16.9252 },
] as const;

export function FilterModal({
  initialQ,
  initialCity,
  initialDistanceKm,
  onApply,
  onClose,
}: {
  initialQ: string;
  initialCity: string | null;
  initialDistanceKm: number;
  onApply: (next: {
    q: string;
    city: string | null;
    distanceKm: number;
  }) => void;
  onClose: () => void;
}) {
  // Lokalny (tymczasowy) stan – nie wpływa na listę, dopóki nie klikniesz "Pokaż wyniki"
  const [q, setQ] = useState<string>(initialQ ?? '');
  const [city, setCity] = useState<string | null>(initialCity ?? null);
  const [distanceKm, setDistanceKm] = useState<number>(initialDistanceKm ?? 30);

  // Gdy modal jest otwierany ponownie – przepisz wartości startowe
  useEffect(() => {
    setQ(initialQ ?? '');
    setCity(initialCity ?? null);
    setDistanceKm(initialDistanceKm ?? 30);
  }, [initialQ, initialCity, initialDistanceKm]);

  const isDirty =
    q !== (initialQ ?? '') ||
    city !== (initialCity ?? null) ||
    distanceKm !== (initialDistanceKm ?? 30);

  // a11y & UX: Esc zamyka, Ctrl/Cmd+Enter zatwierdza
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') {
        onApply({ q, city, distanceKm });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, city, distanceKm, onApply, onClose]);

  const handleClear = () => {
    setQ('');
    setCity(null);
    setDistanceKm(30);
  };

  const handleApply = () => onApply({ q, city, distanceKm });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-title"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose(); // klik w tło = zamknij
      }}
    >
      <div className="w-[92vw] max-w-2xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-1 pb-3 dark:border-zinc-800">
          <div
            id="filters-title"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Doprecyzuj wyszukiwanie
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="rounded-lg px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Wyczyść
            </button>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Zamknij
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-2 sm:grid-cols-2">
          {/* Keywords */}
          <label className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            <Search className="h-4 w-4 opacity-60" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Czego szukasz?"
              className="w-full bg-transparent outline-none"
            />
          </label>

          {/* Location */}
          <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            <MapPin className="h-4 w-4 opacity-60" />
            <span className="opacity-70">Lokalizacja</span>
            <select
              className="w-full bg-transparent outline-none"
              value={city ?? ''}
              onChange={(e) => setCity(e.target.value || null)}
            >
              <option value="">Dowolnie</option>
              {CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {/* Distance */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="opacity-70">Dystans</div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
              />
              <span className="w-12 text-right tabular-nums">
                {distanceKm} km
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-1 pt-3 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Anuluj
          </button>
          <button
            onClick={handleApply}
            disabled={!isDirty}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            title={isDirty ? 'Zastosuj' : 'Brak zmian'}
          >
            Pokaż wyniki
          </button>
        </div>
      </div>
    </div>
  );
}
