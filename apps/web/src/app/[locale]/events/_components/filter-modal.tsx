/**
 * Filter Modal - Simplified for Search & Categories, Location only
 *
 * This modal now only contains:
 * 1. Search & Categories (expanded by default)
 * 2. Location & Distance (collapsed)
 *
 * Time Status, Date Range, and Event Settings have been moved to:
 * - LeftFiltersPanel (desktop sidebar)
 * - MobileFiltersDrawer (mobile slide-in drawer)
 */

'use client';

import {
  IntentStatus,
  JoinMode,
  Level,
  MeetingKind,
} from '@/lib/api/__generated__/react-query-update';
import { useCallback, useEffect, useState } from 'react';
import { useSearchMeta } from '../_hooks/use-search-meta';
import { useFilterState } from '../_hooks/use-filter-state';
import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { Modal } from '@/components/feedback/modal';
import { FilterHeader } from './filter-modal/filter-header';
import { FilterActiveChips } from './filter-modal/filter-active-chips';
import { FilterFooter } from './filter-modal/filter-footer';
import { CollapsibleSection } from './filter-modal/collapsible-section';
import { getFilterModalTranslations } from './filter-modal/translations';
import SearchCombo from './search-combo';
import { LocationSection } from './filters/location-section';
import { INTENTS_CONFIG } from '@/lib/constants/intents';
import { FilterIcon, MapPinIcon } from 'lucide-react';

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
  joinModes?: JoinMode[];
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
  initialJoinModes?: JoinMode[];
  resultsCount?: number;
  onApply: (next: NextFilters) => void;
  onClose: () => void;
  locale?: 'pl' | 'en';
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
  initialJoinModes = [],
  resultsCount,
  onApply,
  onClose,
  locale = 'pl',
}: Props) {
  const t = getFilterModalTranslations(locale);

  // Collapse state for each section - only search is expanded by default
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    location: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
    initialJoinModes,
  });

  const {
    q,
    city,
    cityLat,
    cityLng,
    cityPlaceId,
    distanceKm,
    categories,
    tags,
    setQ,
    setCity,
    setCityLat,
    setCityLng,
    setCityPlaceId,
    setDistanceKm,
    setCategories,
    setTags,
    clearAll,
  } = filterState;

  // Meta - for search suggestions
  const { data, loading } = useSearchMeta(q);

  // Check if form is dirty (has changes from initial values)
  const isDirty =
    q !== initialQ ||
    city !== initialCity ||
    distanceKm !== initialDistanceKm ||
    tags.length > 0 ||
    categories.length > 0;

  // Apply filters - only pass search/location related filters
  const handleApply = useCallback(() => {
    onApply({
      q,
      city,
      cityLat,
      cityLng,
      cityPlaceId,
      distanceKm,
      tags: tags.map((t) => t.slug),
      categories: categories.map((c) => c.slug),
    });
  }, [
    categories,
    city,
    cityLat,
    cityLng,
    cityPlaceId,
    distanceKm,
    onApply,
    q,
    tags,
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

  const applyDisabled = !isDirty;

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
            translations={t}
          />
        }
        content={
          <>
            {/* Active Chips - only for search/location filters */}
            <FilterActiveChips
              q={q}
              city={city}
              distanceKm={distanceKm}
              startISO={null}
              endISO={null}
              status={IntentStatus.Any}
              kinds={[]}
              levels={[]}
              verifiedOnly={false}
              tags={tags}
              keywords={[]}
              categories={categories}
              joinModes={[]}
              onClearQ={() => setQ('')}
              onClearCity={() => {
                setCity(null);
                setCityLat(null);
                setCityLng(null);
                setCityPlaceId(null);
              }}
              onClearDistance={() =>
                setDistanceKm(INTENTS_CONFIG.DEFAULT_DISTANCE_KM)
              }
              onClearStart={() => {}}
              onClearEnd={() => {}}
              onClearStatus={() => {}}
              onClearKinds={() => {}}
              onClearLevels={() => {}}
              onClearVerified={() => {}}
              onClearTags={() => setTags([])}
              onClearKeywords={() => {}}
              onClearCategories={() => setCategories([])}
              onClearJoinModes={() => {}}
            />

            {/* Body - filters */}
            <div className="space-y-0">
              {/* 1. Search & Categories Section */}
              <CollapsibleSection
                title={t.sections.search.title}
                description={t.sections.search.description}
                icon={<FilterIcon className="w-5 h-5" />}
                isExpanded={expandedSections.search}
                onToggle={() => toggleSection('search')}
                activeCount={tags.length + categories.length + (q ? 1 : 0)}
              >
                <SearchCombo
                  value={q}
                  onChangeValue={setQ}
                  onSubmitFreeText={setQ}
                  loading={loading}
                  groups={[
                    {
                      id: 'TAG',
                      label: t.sections.search.tagsLabel,
                      items: data.tags,
                      selected: tags,
                      onSelect: (c) =>
                        setTags((xs) =>
                          xs.some((x) => x.slug === c.slug) ? xs : [...xs, c]
                        ),
                    },
                    {
                      id: 'CATEGORY',
                      label: t.sections.search.categoriesLabel,
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
                      ? t.sections.search.loadingPlaceholder
                      : t.sections.search.placeholder
                  }
                />
              </CollapsibleSection>

              {/* 2. Location & Distance Section */}
              <CollapsibleSection
                divider={true}
                title={t.sections.location.title}
                description={t.sections.location.description}
                icon={<MapPinIcon className="w-5 h-5" />}
                isExpanded={expandedSections.location}
                onToggle={() => toggleSection('location')}
                activeCount={
                  (city ? 1 : 0) +
                  (distanceKm !== INTENTS_CONFIG.DEFAULT_DISTANCE_KM ? 1 : 0)
                }
              >
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
              </CollapsibleSection>
            </div>
          </>
        }
        footer={
          <FilterFooter
            onClose={onClose}
            onApply={handleApply}
            resultsCount={resultsCount}
            isApplyDisabled={applyDisabled}
            applyDisabledReason={undefined}
            translations={t}
          />
        }
      />
    </ErrorBoundary>
  );
}

// Export as default for lazy loading
export default FilterModalRefactoredComponent;
