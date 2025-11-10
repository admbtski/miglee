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

function FilterModalRefactoredComponent({
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
  // Filter state management
  const filterState = useFilterState({
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
  });

  const {
    q,
    city,
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

  // Global shortcuts
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
              {/* Header */}
              <FilterHeader
                onClose={onClose}
                onClear={clearAll}
                isDirty={isDirty}
              />

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
                onClearKeywords={() => setKeywords([])}
                onClearCategories={() => setCategories([])}
              />

              {/* Body */}
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

                {/* Location */}
                <LocationSection
                  city={city}
                  distanceKm={distanceKm}
                  onCityChange={setCity}
                  onDistanceChange={setDistanceKm}
                />

                {/* Date range */}
                <DateRangeSection
                  startISO={startISO}
                  endISO={endISO}
                  onStartChange={setStartISO}
                  onEndChange={setEndISO}
                  dateError={dateError}
                />

                {/* Status */}
                <FilterSection title="Status">
                  <div className="flex flex-wrap gap-2">
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
                </FilterSection>

                {/* Level */}
                <FilterSection title="Poziom">
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
                </FilterSection>

                {/* Verified */}
                <FilterSection
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
                </FilterSection>
              </div>

              {/* Footer */}
              <FilterFooter
                onClose={onClose}
                onApply={handleApply}
                resultsCount={resultsCount}
                isApplyDisabled={applyDisabled}
                applyDisabledReason={dateError || undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Export as default for lazy loading
export default FilterModalRefactoredComponent;

// Named export for backward compatibility
export { FilterModalRefactoredComponent as FilterModalRefactored };
