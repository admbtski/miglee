/**
 * Refactored Filter Modal - using extracted hooks and components
 */

'use client';

import {
  IntentStatus,
  Level,
  MeetingKind,
} from '@/lib/api/__generated__/react-query-update';
import { useCallback, useEffect } from 'react';
import { useSearchMeta } from '../_hooks/use-search-meta';
import { useFilterState } from '../_hooks/use-filter-state';
import { useFilterValidation } from '../_hooks/use-filter-validation';
import { normalizeISO } from '@/lib/utils/date';
import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { Modal } from '@/components/feedback/modal';
import { FilterHeader } from './filter-modal/filter-header';
import { FilterActiveChips } from './filter-modal/filter-active-chips';
import { FilterFooter } from './filter-modal/filter-footer';
import SearchCombo from './search-combo';
import { LocationSection } from './filters/location-section';
import { DateRangeSection } from './filters/date-range-section';
import { FilterSection } from './filters/filter-section';
import { Pill } from '@/components/ui/pill';
import { INTENTS_CONFIG } from '@/lib/constants/intents';

export type NextFilters = {
  q: string;
  city: string | null;
  cityLat?: number | null;
  cityLng?: number | null;
  cityPlaceId?: string | null;
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
  initialCityLat?: number | null;
  initialCityLng?: number | null;
  initialCityPlaceId?: string | null;
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

function FilterModalRefactoredComponent({
  initialQ,
  initialCity,
  initialCityLat = null,
  initialCityLng = null,
  initialCityPlaceId = null,
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
  // Filter state management
  const filterState = useFilterState({
    initialQ,
    initialCity,
    initialCityLat,
    initialCityLng,
    initialCityPlaceId,
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
  });

  const {
    q,
    city,
    cityLat,
    cityLng,
    cityPlaceId,
    distanceKm,
    startISO,
    endISO,
    status,
    kinds,
    levels,
    verifiedOnly,
    keywords,
    categories,
    tags,
    setQ,
    setCity,
    setCityLat,
    setCityLng,
    setCityPlaceId,
    setDistanceKm,
    setStartISO,
    setEndISO,
    setStatus,
    setKinds,
    setLevels,
    setVerifiedOnly,
    setCategories,
    setTags,
    clearAll,
  } = filterState;

  // Meta - for search suggestions
  const { data, loading } = useSearchMeta(q);

  // Validation
  const validation = useFilterValidation({
    startISO,
    endISO,
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
    currentQ: q,
    currentCity: city,
    currentDistanceKm: distanceKm,
    currentStartISO: startISO,
    currentEndISO: endISO,
    currentStatus: status,
    currentKinds: kinds,
    currentLevels: levels,
    currentVerifiedOnly: verifiedOnly,
    currentTags: tags,
    currentKeywords: keywords,
    currentCategories: categories,
  });

  const { dateError, isDirty } = validation;

  // Apply filters
  const handleApply = useCallback(() => {
    const startIsoNorm = normalizeISO(startISO);
    const endIsoNorm = normalizeISO(endISO);
    onApply({
      q,
      city,
      cityLat,
      cityLng,
      cityPlaceId,
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
    cityLat,
    cityLng,
    cityPlaceId,
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

  // Cmd/Ctrl+Enter to apply
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') {
        e.preventDefault();
        handleApply();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleApply]);

  const applyDisabled = !isDirty || !!dateError;

  return (
    <ErrorBoundary>
      <Modal
        open={true}
        onClose={onClose}
        variant="default"
        size="md"
        density="compact"
        closeOnEsc={true}
        closeOnBackdrop={true}
        labelledById="filters-title"
        backdropClassName="bg-black/60 backdrop-blur-md"
        header={
          <FilterHeader
            onClose={onClose}
            onClear={clearAll}
            isDirty={isDirty}
          />
        }
        content={
          <>
            {/* Active Chips */}
            <FilterActiveChips
              q={q}
              city={city}
              distanceKm={distanceKm}
              startISO={startISO}
              endISO={endISO}
              status={status}
              kinds={kinds}
              levels={levels}
              verifiedOnly={verifiedOnly}
              tags={tags}
              keywords={keywords}
              categories={categories}
              onClearQ={() => setQ('')}
              onClearCity={() => setCity(null)}
              onClearDistance={() =>
                setDistanceKm(INTENTS_CONFIG.DEFAULT_DISTANCE_KM)
              }
              onClearStart={() => setStartISO(null)}
              onClearEnd={() => setEndISO(null)}
              onClearStatus={() => setStatus(IntentStatus.Any)}
              onClearKinds={() => setKinds([])}
              onClearLevels={() => setLevels([])}
              onClearVerified={() => setVerifiedOnly(false)}
              onClearTags={() => setTags([])}
              onClearKeywords={() => {}}
              onClearCategories={() => setCategories([])}
            />

            {/* Body - filters */}
            <div className="space-y-8">
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

              {/* Location */}
              <LocationSection
                city={city}
                cityLat={cityLat}
                cityLng={cityLng}
                cityPlaceId={cityPlaceId}
                distanceKm={distanceKm}
                onCityChange={setCity}
                onCityLatChange={setCityLat}
                onCityLngChange={setCityLng}
                onCityPlaceIdChange={setCityPlaceId}
                onDistanceChange={setDistanceKm}
              />

              {/* Date range */}
              <DateRangeSection
                startISO={startISO}
                endISO={endISO}
                onStartChange={setStartISO}
                onEndChange={setEndISO}
              />
              {dateError && (
                <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                  {dateError}
                </div>
              )}

              {/* Status */}
              <FilterSection title="Status">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    IntentStatus.Any,
                    IntentStatus.Available,
                    IntentStatus.Ongoing,
                    IntentStatus.Full,
                    IntentStatus.Locked,
                    IntentStatus.Past,
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
              </FilterSection>

              {/* Kinds */}
              <FilterSection title="Tryb spotkania">
                <div className="grid grid-cols-3 gap-2">
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
                        title={`Przełącz: ${t}`}
                      >
                        {t}
                      </Pill>
                    );
                  })}
                </div>
              </FilterSection>

              {/* Level */}
              <FilterSection title="Poziom">
                <div className="grid grid-cols-3 gap-2">
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
              </FilterSection>

              {/* Verified */}
              <FilterSection
                title="Organizator"
                hint="Pokaż tylko zweryfikowanych organizatorów."
              >
                <label className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 cursor-pointer select-none text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    aria-label="Tylko zweryfikowani organizatorzy"
                  />
                  <span
                    className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-all duration-200 ${verifiedOnly ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${verifiedOnly ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </span>
                  <span className="flex items-center gap-2 font-medium">
                    {verifiedOnly && (
                      <svg
                        className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    Tylko zweryfikowani
                  </span>
                </label>
              </FilterSection>
            </div>
          </>
        }
        footer={
          <FilterFooter
            onClose={onClose}
            onApply={handleApply}
            resultsCount={resultsCount}
            isApplyDisabled={applyDisabled}
            applyDisabledReason={dateError || undefined}
          />
        }
      />
    </ErrorBoundary>
  );
}

// Export as default for lazy loading
export default FilterModalRefactoredComponent;

// Named export for backward compatibility
export { FilterModalRefactoredComponent as FilterModalRefactored };
