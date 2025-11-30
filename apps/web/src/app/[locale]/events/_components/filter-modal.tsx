/**
 * Filter Modal - Refactored with separated Time Status and Event Settings
 *
 * Key improvements:
 * 1. Time Status (UPCOMING/ONGOING/PAST) is separated from Event Settings
 * 2. Time Status disables date range inputs (mutually exclusive)
 * 3. Date range selection automatically resets Time Status to ANY
 * 4. Location has Global/NearMe/CustomCity modes
 * 5. Clear All resets everything including status and dates
 * 6. UI follows Airbnb/Eventbrite/Meetup standards
 *
 * Section Order (Priority-based):
 * 1. Search & Categories (expanded by default)
 * 2. Location & Distance (collapsed)
 * 3. Time Status (collapsed) - BEFORE date range
 * 4. Date Range (collapsed) - AFTER time status
 * 5. Event Settings (collapsed) - Meeting type, level, join mode, organizer
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
  ClockIcon,
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
    dateRange: false,
    timeStatus: false,
    eventSettings: false,
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
    setStartISO: _setStartISO,
    setEndISO: _setEndISO,
    setStatus: _setStatus,
    setKinds,
    setLevels,
    setVerifiedOnly,
    setCategories,
    setTags,
    setJoinModes,
    clearAll: _clearAll,
  } = filterState;

  // Enhanced clearAll that resets status and dates
  const clearAll = useCallback(() => {
    _clearAll();
    _setStatus(IntentStatus.Any);
    _setStartISO(null);
    _setEndISO(null);
  }, [_clearAll, _setStatus, _setStartISO, _setEndISO]);

  // Wrapped status setter: when changing to time-based status (UPCOMING/ONGOING/PAST),
  // automatically reset date range
  const setStatus = useCallback(
    (newStatus: IntentStatus) => {
      _setStatus(newStatus);
      if (
        newStatus === IntentStatus.Upcoming ||
        newStatus === IntentStatus.Ongoing ||
        newStatus === IntentStatus.Past
      ) {
        _setStartISO(null);
        _setEndISO(null);
      }
    },
    [_setStatus, _setStartISO, _setEndISO]
  );

  // Wrapped date setters: when user sets a date range, automatically change status to ANY
  const setStartISO = useCallback(
    (iso: string | null) => {
      _setStartISO(iso);
      if (iso !== null && status !== IntentStatus.Any) {
        _setStatus(IntentStatus.Any);
      }
    },
    [_setStartISO, _setStatus, status]
  );

  const setEndISO = useCallback(
    (iso: string | null) => {
      _setEndISO(iso);
      if (iso !== null && status !== IntentStatus.Any) {
        _setStatus(IntentStatus.Any);
      }
    },
    [_setEndISO, _setStatus, status]
  );

  // Check if date inputs should be disabled (when time-based status is selected)
  const dateInputsDisabled =
    status === IntentStatus.Upcoming ||
    status === IntentStatus.Ongoing ||
    status === IntentStatus.Past;

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

              {/* 3. Time Status Section (PRIORITY: Before date range) */}
              <CollapsibleSection
                divider={true}
                title={t.sections.timeStatus.title}
                description={t.sections.timeStatus.description}
                icon={<ClockIcon className="w-5 h-5" />}
                isExpanded={expandedSections.timeStatus}
                onToggle={() => toggleSection('timeStatus')}
                activeCount={status !== IntentStatus.Any ? 1 : 0}
              >
                <FilterSection
                  title={t.sections.timeStatus.title}
                  hint={t.sections.timeStatus.hint}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        value: IntentStatus.Any,
                        label: t.sections.timeStatus.any,
                      },
                      {
                        value: IntentStatus.Upcoming,
                        label: t.sections.timeStatus.upcoming,
                      },
                      {
                        value: IntentStatus.Ongoing,
                        label: t.sections.timeStatus.ongoing,
                      },
                      {
                        value: IntentStatus.Past,
                        label: t.sections.timeStatus.past,
                      },
                    ].map(({ value, label }) => (
                      <Pill
                        key={value}
                        active={status === value}
                        onClick={() => setStatus(value)}
                        title={`${t.filterHints.timeStatus} ${label}`}
                      >
                        {label}
                      </Pill>
                    ))}
                  </div>
                </FilterSection>
              </CollapsibleSection>

              {/* 4. Date Range Section (AFTER Time Status) */}
              <CollapsibleSection
                divider={true}
                title={t.sections.dateRange.title}
                description={
                  dateInputsDisabled
                    ? t.sections.dateRange.disabledByStatus
                    : t.sections.dateRange.description
                }
                icon={<CalendarIcon className="w-5 h-5" />}
                isExpanded={expandedSections.dateRange}
                onToggle={() => toggleSection('dateRange')}
                activeCount={(startISO ? 1 : 0) + (endISO ? 1 : 0)}
              >
                <DateRangeSection
                  startISO={startISO}
                  endISO={endISO}
                  onStartChange={setStartISO}
                  onEndChange={setEndISO}
                  disabled={dateInputsDisabled}
                />
                {dateError && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {dateError}
                  </div>
                )}
              </CollapsibleSection>

              {/* 5. Event Settings Section (Separated from Time Status) */}
              <CollapsibleSection
                divider={true}
                title={t.sections.eventSettings.title}
                description={t.sections.eventSettings.description}
                icon={<SettingsIcon className="w-5 h-5" />}
                isExpanded={expandedSections.eventSettings}
                onToggle={() => toggleSection('eventSettings')}
                activeCount={
                  kinds.length +
                  levels.length +
                  joinModes.length +
                  (verifiedOnly ? 1 : 0)
                }
              >
                <div className="space-y-6">
                  {/* Meeting Kind */}
                  <FilterSection
                    title={t.sections.eventSettings.meetingKind.title}
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          kind: MeetingKind.Onsite,
                          label: t.sections.eventSettings.meetingKind.onsite,
                        },
                        {
                          kind: MeetingKind.Online,
                          label: t.sections.eventSettings.meetingKind.online,
                        },
                        {
                          kind: MeetingKind.Hybrid,
                          label: t.sections.eventSettings.meetingKind.hybrid,
                        },
                      ].map(({ kind, label }) => {
                        const active = kinds.includes(kind);
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
                  <FilterSection title={t.sections.eventSettings.level.title}>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          lv: Level.Beginner,
                          label: t.sections.eventSettings.level.beginner,
                        },
                        {
                          lv: Level.Intermediate,
                          label: t.sections.eventSettings.level.intermediate,
                        },
                        {
                          lv: Level.Advanced,
                          label: t.sections.eventSettings.level.advanced,
                        },
                      ].map(({ lv, label }) => {
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
                            title={`${t.filterHints.level} ${label}`}
                          >
                            {label}
                          </Pill>
                        );
                      })}
                    </div>
                  </FilterSection>

                  {/* Join Mode */}
                  <FilterSection
                    title={t.sections.eventSettings.joinMode.title}
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          jm: JoinMode.Open,
                          label: t.sections.eventSettings.joinMode.open,
                        },
                        {
                          jm: JoinMode.Request,
                          label: t.sections.eventSettings.joinMode.request,
                        },
                        {
                          jm: JoinMode.InviteOnly,
                          label: t.sections.eventSettings.joinMode.inviteOnly,
                        },
                      ].map(({ jm, label }) => {
                        const active = joinModes.includes(jm);
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

                  {/* Verified Organizer */}
                  <FilterSection
                    title={t.sections.eventSettings.organizer.title}
                    hint={t.sections.eventSettings.organizer.hint}
                  >
                    <label className="inline-flex items-center gap-3 px-4 py-3 transition-colors border cursor-pointer select-none rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        aria-label={
                          t.sections.eventSettings.organizer.verifiedOnly
                        }
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
                            className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
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
                        {t.sections.eventSettings.organizer.verifiedOnly}
                      </span>
                    </label>
                  </FilterSection>
                </div>
              </CollapsibleSection>

              {/* UX Hint at the bottom */}
              <div className="pt-6">
                <div className="h-px mb-6 bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />
                <div
                  role="note"
                  className="flex items-start gap-3 p-4 text-indigo-900 border rounded-2xl border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-violet-50 dark:border-indigo-500/20 dark:from-indigo-950/30 dark:to-violet-950/30 dark:text-indigo-100"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full shrink-0
                             bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/60
                             dark:bg-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-500/30"
                  >
                    <Info className="w-4 h-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-relaxed">
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
