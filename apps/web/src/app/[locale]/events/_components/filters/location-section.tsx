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
          'mt-4 px-4 py-3.5 bg-white border rounded-2xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900',
          !city ? 'opacity-50' : '',
        ].join(' ')}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Distance
          </span>
          <span className="text-sm tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
            {city ? `${distanceKm} km` : 'Global'}
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={100}
          step={5}
          value={distanceKm}
          onChange={(e) => onDistanceChange(Number(e.target.value))}
          className="w-full h-2 bg-zinc-200 rounded-full appearance-none cursor-pointer dark:bg-zinc-700
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                     [&::-webkit-slider-thumb]:from-indigo-600 [&::-webkit-slider-thumb]:to-violet-600 
                     [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:hover:shadow-lg [&::-webkit-slider-thumb]:transition-shadow
                     [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full 
                     [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-indigo-600 
                     [&::-moz-range-thumb]:to-violet-600 [&::-moz-range-thumb]:border-0 
                     [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer
                     disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Distance in kilometers"
          disabled={!city}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {[5, 10, 20, 30, 50, 100].map((km) => (
            <button
              key={km}
              type="button"
              disabled={!city}
              onClick={() => onDistanceChange(km)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-medium border transition-all',
                distanceKm === km
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-sm'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-800',
                !city ? 'opacity-60' : '',
              ].join(' ')}
              aria-label={`Set ${km} km`}
            >
              {km} km
            </button>
          ))}
        </div>
      </div>
    </FilterSection>
  );
});
