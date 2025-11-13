'use client';

import { memo, useState } from 'react';
import { FilterSection } from './filter-section';
import { LocationCombo } from '@/components/forms/location-combobox';

type LocationSectionProps = {
  city: string | null;
  distanceKm: number;
  onCityChange: (city: string | null) => void;
  onDistanceChange: (distance: number) => void;
  // NEW: Store city coordinates and placeId for precise filtering
  cityLat?: number | null;
  cityLng?: number | null;
  cityPlaceId?: string | null;
  onCityLatChange?: (lat: number | null) => void;
  onCityLngChange?: (lng: number | null) => void;
  onCityPlaceIdChange?: (cityPlaceId: string | null) => void;
};

export const LocationSection = memo(function LocationSection({
  city,
  distanceKm,
  onCityChange,
  onDistanceChange,
  onCityLatChange,
  onCityLngChange,
  onCityPlaceIdChange,
}: LocationSectionProps) {
  const [locationText, setLocationText] = useState<string>(city ?? '');

  const handleTextChange = (text: string) => {
    setLocationText(text);
    // If user clears the text, also clear coordinates
    if (!text.trim()) {
      onCityChange(null);
      if (onCityLatChange) onCityLatChange(null);
      if (onCityLngChange) onCityLngChange(null);
      if (onCityPlaceIdChange) onCityPlaceIdChange(null);
    }
  };

  return (
    <FilterSection
      title="Lokalizacja"
      hint="Wybierz miasto, aby filtrować po odległości."
    >
      <LocationCombo
        value={locationText}
        onChangeText={handleTextChange}
        onPickPlace={({
          cityName,
          cityPlaceId: pickedCityPlaceId,
          displayName,
          address,
          lat,
          lng,
        }) => {
          // Prefer cityName, fallback to displayName or address
          const finalCityName = cityName || displayName || address || '';
          setLocationText(finalCityName);
          onCityChange(finalCityName || null);

          // Store city coordinates for distance filtering
          if (onCityLatChange) {
            onCityLatChange(lat || null);
          }
          if (onCityLngChange) {
            onCityLngChange(lng || null);
          }

          // Store cityPlaceId for precise filtering
          if (onCityPlaceIdChange) {
            onCityPlaceIdChange(pickedCityPlaceId || null);
          }
        }}
        placeholder="Wpisz miasto..."
        includedPrimaryTypes={[
          'locality',
          'postal_town',
          'administrative_area_level_2',
        ]}
        bias={{
          location: { lat: 52.2297, lng: 21.0122 }, // Poland center
          radius: 50_000, // 50km radius (max allowed by Google Maps API)
        }}
      />

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
