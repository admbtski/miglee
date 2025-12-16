/**
 * Top Drawer - Slide-down panel for Search, Location, Distance
 * Inspired by JustJoin.it search experience
 *
 * NOTE: Time Status and Date Range are in the sidebar/drawer filters, NOT here.
 */

'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Ruler, Search, X } from 'lucide-react';
import { useSearchMeta, type SearchMeta } from '@/features/events/hooks';
import SearchCombo from '@/features/search/components/search-combo';
import { LocationCombo } from '@/components/forms/location-combobox';
import { useTranslations } from '@/lib/i18n/provider-ssr';

export type TopDrawerFocusSection = 'search' | 'location' | 'distance' | null;

export type TopDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  focusSection?: TopDrawerFocusSection;
  // Search
  q: string;
  tags: SearchMeta['tags'];
  categories: SearchMeta['categories'];
  onQChange: (q: string) => void;
  onTagsChange: (tags: SearchMeta['tags']) => void;
  onCategoriesChange: (categories: SearchMeta['categories']) => void;
  // Location
  city: string | null;
  distanceKm: number;
  onCityChange: (city: string | null) => void;
  onCityLatChange: (lat: number | null) => void;
  onCityLngChange: (lng: number | null) => void;
  onCityPlaceIdChange: (placeId: string | null) => void;
  onDistanceChange: (distance: number) => void;
  // Apply
  onApply: () => void;
};

export const TopDrawer = memo(function TopDrawer({
  isOpen,
  onClose,
  focusSection = 'search',
  q,
  tags,
  categories,
  onQChange,
  onTagsChange,
  onCategoriesChange,
  city,
  distanceKm,
  onCityChange,
  onCityLatChange,
  onCityLngChange,
  onCityPlaceIdChange,
  onDistanceChange,
  onApply,
}: TopDrawerProps) {
  const translations = useTranslations();
  const t = translations.eventsSearch;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [locationText, setLocationText] = useState<string>(city ?? '');

  // Search meta for suggestions
  const { data: searchData, loading: searchLoading } = useSearchMeta(q);

  // Sync location text with city prop
  useEffect(() => {
    setLocationText(city ?? '');
  }, [city]);

  // Focus the appropriate section when drawer opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (focusSection === 'search' && searchInputRef.current) {
          searchInputRef.current.focus();
        } else if (
          (focusSection === 'location' || focusSection === 'distance') &&
          locationInputRef.current
        ) {
          locationInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, focusSection]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLocationTextChange = useCallback(
    (text: string) => {
      setLocationText(text);
      if (!text.trim()) {
        onCityChange(null);
        onCityLatChange(null);
        onCityLngChange(null);
        onCityPlaceIdChange(null);
      }
    },
    [onCityChange, onCityLatChange, onCityLngChange, onCityPlaceIdChange]
  );

  const handleApplyAndClose = useCallback(() => {
    onApply();
    onClose();
  }, [onApply, onClose]);

  // Handle Enter key in inputs
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleApplyAndClose();
      }
    },
    [handleApplyAndClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 top-0 z-[101] max-h-[85vh] overflow-y-auto"
            onKeyDown={handleKeyDown}
          >
            <div className="mx-auto max-w-4xl px-4 pt-6 pb-8">
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {t.title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    aria-label={t.close}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Search */}
                  <section>
                    <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      <Search className="w-4 h-4 text-indigo-500" />
                      {t.searchLabel}
                    </label>
                    <SearchCombo
                      value={q}
                      onChangeValue={onQChange}
                      onSubmitFreeText={onQChange}
                      loading={searchLoading}
                      groups={[
                        {
                          id: 'TAG',
                          label: t.tagsLabel,
                          items: searchData.tags,
                          selected: tags,
                          onSelect: (tag) =>
                            onTagsChange(
                              tags.some((t) => t.slug === tag.slug)
                                ? tags
                                : [...tags, tag]
                            ),
                        },
                        {
                          id: 'CATEGORY',
                          label: t.categoriesLabel,
                          items: searchData.categories,
                          selected: categories,
                          onSelect: (cat) =>
                            onCategoriesChange(
                              categories.some((c) => c.slug === cat.slug)
                                ? categories
                                : [...categories, cat]
                            ),
                        },
                      ]}
                      placeholder={
                        searchLoading
                          ? t.loadingPlaceholder
                          : t.searchPlaceholder
                      }
                    />

                    {/* Selected tags/categories chips */}
                    {(tags.length > 0 || categories.length > 0) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tags.map((tag) => (
                          <span
                            key={tag.slug}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-100 text-indigo-700 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300"
                          >
                            {tag.label}
                            <button
                              onClick={() =>
                                onTagsChange(
                                  tags.filter((t) => t.slug !== tag.slug)
                                )
                              }
                              className="hover:text-indigo-900 dark:hover:text-indigo-100"
                              aria-label={`Remove ${tag.label}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                        {categories.map((cat) => (
                          <span
                            key={cat.slug}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-violet-100 text-violet-700 rounded-full dark:bg-violet-900/50 dark:text-violet-300"
                          >
                            {cat.label}
                            <button
                              onClick={() =>
                                onCategoriesChange(
                                  categories.filter((c) => c.slug !== cat.slug)
                                )
                              }
                              className="hover:text-violet-900 dark:hover:text-violet-100"
                              aria-label={`Remove ${cat.label}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Location & Distance */}
                  <section className="grid gap-6 md:grid-cols-2">
                    {/* Location */}
                    <div>
                      <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        {t.locationLabel}
                      </label>
                      <LocationCombo
                        value={locationText}
                        onChangeText={handleLocationTextChange}
                        onPickPlace={({
                          cityName,
                          cityPlaceId: pickedPlaceId,
                          displayName,
                          address,
                          lat,
                          lng,
                        }) => {
                          const finalName =
                            cityName || displayName || address || '';
                          setLocationText(finalName);
                          onCityChange(finalName || null);
                          onCityLatChange(lat || null);
                          onCityLngChange(lng || null);
                          onCityPlaceIdChange(pickedPlaceId || null);
                        }}
                        placeholder={t.locationPlaceholder}
                        includedPrimaryTypes={[
                          'locality',
                          'postal_town',
                          'administrative_area_level_2',
                        ]}
                        bias={{
                          location: { lat: 52.2297, lng: 21.0122 },
                          radius: 50_000,
                        }}
                      />
                    </div>

                    {/* Distance */}
                    <div>
                      <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        <Ruler className="w-4 h-4 text-amber-500" />
                        {t.distanceLabel}
                      </label>
                      <div
                        className={`px-4 py-3.5 bg-white border rounded-2xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800/60 transition-opacity ${
                          !city ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {city ? `${distanceKm} km` : t.global}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={100}
                          step={5}
                          value={distanceKm}
                          onChange={(e) =>
                            onDistanceChange(Number(e.target.value))
                          }
                          disabled={!city}
                          className="w-full h-2 bg-zinc-200 rounded-full appearance-none cursor-pointer dark:bg-zinc-700
                                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                                     [&::-webkit-slider-thumb]:from-amber-500 [&::-webkit-slider-thumb]:to-orange-500 
                                     [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Distance in kilometers"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {[5, 10, 20, 30, 50, 100].map((km) => (
                            <button
                              key={km}
                              type="button"
                              disabled={!city}
                              onClick={() => onDistanceChange(km)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-all ${
                                distanceKm === km
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-sm'
                                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700'
                              } ${!city ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {km} km
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800/80 dark:bg-zinc-900/80">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    ⌘/Ctrl + Enter
                  </p>
                  <button
                    onClick={handleApplyAndClose}
                    className="inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40"
                  >
                    <Search className="w-4 h-4" />
                    {t.apply}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default TopDrawer;
