/**
 * Filter Modal - Modern UI matching create-edit-intent-modal style
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
import { useFilterValidation } from '../_hooks/use-filter-validation';
import { normalizeISO } from '@/lib/utils/date';
import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { Modal } from '@/components/feedback/modal';
import { FilterHeader } from './filter-modal/filter-header';
import { FilterActiveChips } from './filter-modal/filter-active-chips';
import { FilterFooter } from './filter-modal/filter-footer';
import { CollapsibleSection } from './filter-modal/collapsible-section';
import { getFilterModalTranslations } from './filter-modal/translations';
import SearchCombo from './search-combo';
import { LocationSection } from './filters/location-section';
import { DateRangeSection } from './filters/date-range-section';
import { FilterSection } from './filters/filter-section';
import { Pill } from '@/components/ui/pill';
import { INTENTS_CONFIG } from '@/lib/constants/intents';
import {
  FilterIcon,
  MapPinIcon,
  CalendarIcon,
  SettingsIcon,
  Info,
} from 'lucide-react';

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
  locale?: 'pl' | 'en'; // Optional locale prop, defaults to 'pl'
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
  // Get translations based on locale prop
  const t = getFilterModalTranslations(locale);

  // Helper functions to get translated labels
  const getStatusLabel = (status: IntentStatus) => {
    switch (status) {
      case IntentStatus.Any:
        return t.sections.settings.status.any;
      case IntentStatus.Available:
        return t.sections.settings.status.available;
      case IntentStatus.Ongoing:
        return t.sections.settings.status.ongoing;
      case IntentStatus.Full:
        return t.sections.settings.status.full;
      case IntentStatus.Locked:
        return t.sections.settings.status.locked;
      case IntentStatus.Past:
        return t.sections.settings.status.past;
      default:
        return status;
    }
  };

  const getMeetingKindLabel = (kind: MeetingKind) => {
    switch (kind) {
      case MeetingKind.Onsite:
        return t.sections.settings.meetingKind.onsite;
      case MeetingKind.Online:
        return t.sections.settings.meetingKind.online;
      case MeetingKind.Hybrid:
        return t.sections.settings.meetingKind.hybrid;
      default:
        return kind;
    }
  };

  const getLevelLabel = (level: Level) => {
    switch (level) {
      case Level.Beginner:
        return t.sections.settings.level.beginner;
      case Level.Intermediate:
        return t.sections.settings.level.intermediate;
      case Level.Advanced:
        return t.sections.settings.level.advanced;
      default:
        return level;
    }
  };

  const getJoinModeLabel = (mode: JoinMode) => {
    switch (mode) {
      case JoinMode.Open:
        return t.sections.settings.joinMode.open;
      case JoinMode.Request:
        return t.sections.settings.joinMode.request;
      case JoinMode.InviteOnly:
        return t.sections.settings.joinMode.inviteOnly;
      default:
        return mode;
    }
  };

  // Collapse state for each section
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    location: true,
    dateRange: true,
    settings: true,
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
    startISO,
    endISO,
    status,
    kinds,
    levels,
    verifiedOnly,
    keywords,
    categories,
    tags,
    joinModes,
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
    setJoinModes,
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
    initialJoinModes,
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
    currentJoinModes: joinModes,
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
      joinModes,
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
    joinModes,
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
            translations={t}
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
              joinModes={joinModes}
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
              onClearStart={() => setStartISO(null)}
              onClearEnd={() => setEndISO(null)}
              onClearStatus={() => setStatus(IntentStatus.Any)}
              onClearKinds={() => setKinds([])}
              onClearLevels={() => setLevels([])}
              onClearVerified={() => setVerifiedOnly(false)}
              onClearTags={() => setTags([])}
              onClearKeywords={() => {}}
              onClearCategories={() => setCategories([])}
              onClearJoinModes={() => setJoinModes([])}
            />

            {/* Body - filters */}
            <div className="space-y-0">
              {/* Search Section */}
              <CollapsibleSection
                title={t.sections.search.title}
                description={t.sections.search.description}
                icon={<FilterIcon className="h-5 w-5" />}
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

              {/* Location Section */}
              <CollapsibleSection
                divider={true}
                title={t.sections.location.title}
                description={t.sections.location.description}
                icon={<MapPinIcon className="h-5 w-5" />}
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

              {/* Date Range Section */}
              <CollapsibleSection
                divider={true}
                title={t.sections.dateRange.title}
                description={t.sections.dateRange.description}
                icon={<CalendarIcon className="h-5 w-5" />}
                isExpanded={expandedSections.dateRange}
                onToggle={() => toggleSection('dateRange')}
                activeCount={(startISO ? 1 : 0) + (endISO ? 1 : 0)}
              >
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
              </CollapsibleSection>

              {/* Settings Section */}
              <CollapsibleSection
                divider={true}
                title={t.sections.settings.title}
                description={t.sections.settings.description}
                icon={<SettingsIcon className="h-5 w-5" />}
                isExpanded={expandedSections.settings}
                onToggle={() => toggleSection('settings')}
                activeCount={
                  (status !== IntentStatus.Any ? 1 : 0) +
                  kinds.length +
                  levels.length +
                  joinModes.length +
                  (verifiedOnly ? 1 : 0)
                }
              >
                <div className="space-y-6">
                  {/* Status */}
                  <FilterSection title={t.sections.settings.status.title}>
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
                          title={`${t.filterHints.status} ${getStatusLabel(val)}`}
                        >
                          {getStatusLabel(val)}
                        </Pill>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Kinds */}
                  <FilterSection title={t.sections.settings.meetingKind.title}>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        MeetingKind.Onsite,
                        MeetingKind.Online,
                        MeetingKind.Hybrid,
                      ].map((kind) => {
                        const active = kinds.includes(kind);
                        const label = getMeetingKindLabel(kind);
                        return (
                          <Pill
                            key={kind}
                            active={active}
                            onClick={() =>
                              setKinds((curr) =>
                                active
                                  ? curr.filter((x) => x !== kind)
                                  : [...curr, kind]
                              )
                            }
                            title={`${t.filterHints.meetingKind} ${label}`}
                          >
                            {label}
                          </Pill>
                        );
                      })}
                    </div>
                  </FilterSection>

                  {/* Level */}
                  <FilterSection title={t.sections.settings.level.title}>
                    <div className="grid grid-cols-3 gap-2">
                      {[Level.Beginner, Level.Intermediate, Level.Advanced].map(
                        (lv) => {
                          const active = levels.includes(lv);
                          const label = getLevelLabel(lv);
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
                              title={`${t.filterHints.level} ${label}`}
                            >
                              {label}
                            </Pill>
                          );
                        }
                      )}
                    </div>
                  </FilterSection>

                  {/* Join Mode */}
                  <FilterSection title={t.sections.settings.joinMode.title}>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        JoinMode.Open,
                        JoinMode.Request,
                        JoinMode.InviteOnly,
                      ].map((jm) => {
                        const active = joinModes.includes(jm);
                        const label = getJoinModeLabel(jm);
                        return (
                          <Pill
                            key={jm}
                            active={active}
                            onClick={() =>
                              setJoinModes((curr) =>
                                active
                                  ? curr.filter((x) => x !== jm)
                                  : [...curr, jm]
                              )
                            }
                            title={`${t.filterHints.joinMode} ${label}`}
                          >
                            {label}
                          </Pill>
                        );
                      })}
                    </div>
                  </FilterSection>

                  {/* Verified */}
                  <FilterSection
                    title={t.sections.settings.organizer.title}
                    hint={t.sections.settings.organizer.hint}
                  >
                    <label className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 cursor-pointer select-none text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        aria-label={t.sections.settings.organizer.verifiedOnly}
                      />
                      <span
                        className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-all duration-200 ${verifiedOnly ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                      >
                        <span
                          className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${verifiedOnly ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </span>
                      <span className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
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
                        {t.sections.settings.organizer.verifiedOnly}
                      </span>
                    </label>
                  </FilterSection>
                </div>
              </CollapsibleSection>

              {/* Info note */}
              <div className="pt-6">
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800 mb-6" />
                <div
                  role="note"
                  className="flex items-start gap-3 rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-violet-50 p-4
                             text-indigo-900 dark:border-indigo-500/20 dark:from-indigo-950/30 dark:to-violet-950/30 dark:text-indigo-100"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full shrink-0
                             bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/60
                             dark:bg-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-500/30"
                  >
                    <Info className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed font-medium">
                      <span className="text-indigo-700 dark:text-indigo-300">
                        {t.proTip.title}
                      </span>{' '}
                      {t.proTip.message}
                    </p>
                  </div>
                </div>
              </div>
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
            translations={t}
          />
        }
      />
    </ErrorBoundary>
  );
}

// Export as default for lazy loading
export default FilterModalRefactoredComponent;
