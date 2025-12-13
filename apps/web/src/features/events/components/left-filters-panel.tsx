/**
 * Left Filters Panel - Desktop sidebar / Mobile drawer with filters
 * Contains: Time Status, Date Range, Meeting Type, Level, Join Mode, Verified Organizer
 * All sections are collapsible with default open state
 */

'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  EventStatus,
  JoinMode,
  Level,
  MeetingKind,
} from '@/lib/api/__generated__/react-query-update';
import {
  Globe,
  Laptop,
  MapPin,
  Users,
  GraduationCap,
  DoorOpen,
  Lock,
  UserCheck,
  X,
  Check,
  Loader2,
  Clock,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { useTranslations } from '@/lib/i18n/provider-ssr';
import type { CommittedFilters } from '@/features/events/types';

export type LeftFiltersPanelProps = {
  filters: CommittedFilters;
  onFiltersChange: (next: Partial<CommittedFilters>) => void;
  isDrawer?: boolean;
  onClose?: () => void;
  isPending?: boolean;
  onHide?: () => void; // For desktop hide functionality
};

// Helper functions for date conversion
const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

function isoToLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function localInputToISO(val?: string | null): string | null {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Date preset helpers
function getPresetDates(preset: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'nowPlus1h': {
      const start = new Date(now);
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      return { start, end };
    }
    case 'tonight': {
      const start = new Date(today);
      start.setHours(18, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'tomorrow': {
      const start = new Date(today);
      start.setDate(start.getDate() + 1);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'weekend': {
      const dayOfWeek = today.getDay();
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
      const start = new Date(today);
      start.setDate(start.getDate() + daysUntilSaturday);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'next7days': {
      const start = new Date(now);
      const end = new Date(today);
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    default:
      return { start: now, end: now };
  }
}

// Collapsible Section Component
type CollapsibleSectionProps = {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: number;
};

function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  badge,
}: CollapsibleSectionProps) {
  return (
    <section className="border-b border-zinc-100 dark:border-zinc-800/50 pb-4 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 group hover:opacity-80 transition-opacity"
        aria-expanded={isOpen}
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          {icon}
          <span>{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold rounded-md bg-indigo-600 text-white">
              {badge}
            </span>
          )}
        </h3>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export const LeftFiltersPanel = memo(function LeftFiltersPanel({
  filters,
  onFiltersChange,
  isDrawer = false,
  onClose,
  isPending = false,
  onHide,
}: LeftFiltersPanelProps) {
  const translations = useTranslations();
  const t = translations.eventsFilters;

  // Collapsible state - all open by default
  const [openSections, setOpenSections] = useState({
    timeStatus: true,
    dateRange: true,
    meetingType: true,
    level: true,
    joinMode: true,
    organizer: true,
  });

  const toggleSection = useCallback((section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Check if date inputs should be disabled
  const dateInputsDisabled =
    filters.status === EventStatus.Upcoming ||
    filters.status === EventStatus.Ongoing ||
    filters.status === EventStatus.Past;

  // Time Status change handler
  const handleStatusChange = useCallback(
    (newStatus: EventStatus) => {
      const updates: Partial<CommittedFilters> = { status: newStatus };
      if (
        newStatus === EventStatus.Upcoming ||
        newStatus === EventStatus.Ongoing ||
        newStatus === EventStatus.Past
      ) {
        updates.startISO = null;
        updates.endISO = null;
      }
      onFiltersChange(updates);
    },
    [onFiltersChange]
  );

  // Date change handlers
  const handleStartChange = useCallback(
    (val: string) => {
      const iso = localInputToISO(val);
      const updates: Partial<CommittedFilters> = { startISO: iso };
      if (iso !== null && filters.status !== EventStatus.Any) {
        updates.status = EventStatus.Any;
      }
      onFiltersChange(updates);
    },
    [onFiltersChange, filters.status]
  );

  const handleEndChange = useCallback(
    (val: string) => {
      const iso = localInputToISO(val);
      const updates: Partial<CommittedFilters> = { endISO: iso };
      if (iso !== null && filters.status !== EventStatus.Any) {
        updates.status = EventStatus.Any;
      }
      onFiltersChange(updates);
    },
    [onFiltersChange, filters.status]
  );

  const handlePresetClick = useCallback(
    (preset: string) => {
      const { start, end } = getPresetDates(preset);
      onFiltersChange({
        status: EventStatus.Any,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
      });
    },
    [onFiltersChange]
  );

  // Toggle handlers
  const toggleKind = useCallback(
    (kind: MeetingKind) => {
      const newKinds = filters.kinds.includes(kind)
        ? filters.kinds.filter((k) => k !== kind)
        : [...filters.kinds, kind];
      onFiltersChange({ kinds: newKinds });
    },
    [filters.kinds, onFiltersChange]
  );

  const toggleLevel = useCallback(
    (level: Level) => {
      const newLevels = filters.levels.includes(level)
        ? filters.levels.filter((l) => l !== level)
        : [...filters.levels, level];
      onFiltersChange({ levels: newLevels });
    },
    [filters.levels, onFiltersChange]
  );

  const toggleJoinMode = useCallback(
    (jm: JoinMode) => {
      const newJoinModes = filters.joinModes.includes(jm)
        ? filters.joinModes.filter((j) => j !== jm)
        : [...filters.joinModes, jm];
      onFiltersChange({ joinModes: newJoinModes });
    },
    [filters.joinModes, onFiltersChange]
  );

  const handleVerifiedChange = useCallback(
    (checked: boolean) => {
      onFiltersChange({ verifiedOnly: checked });
    },
    [onFiltersChange]
  );

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      status: EventStatus.Any,
      startISO: null,
      endISO: null,
      kinds: [],
      levels: [],
      joinModes: [],
      verifiedOnly: false,
    });
  }, [onFiltersChange]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status !== EventStatus.Any) count++;
    if (filters.startISO || filters.endISO) count++;
    count += filters.kinds.length;
    count += filters.levels.length;
    count += filters.joinModes.length;
    if (filters.verifiedOnly) count++;
    return count;
  }, [filters]);

  // Section badges
  const timeStatusBadge = filters.status !== EventStatus.Any ? 1 : 0;
  const dateRangeBadge = filters.startISO || filters.endISO ? 1 : 0;
  const meetingTypeBadge = filters.kinds.length;
  const levelBadge = filters.levels.length;
  const joinModeBadge = filters.joinModes.length;
  const organizerBadge = filters.verifiedOnly ? 1 : 0;

  const statusOptions = [
    { value: EventStatus.Any, label: t.any },
    { value: EventStatus.Upcoming, label: t.upcoming },
    { value: EventStatus.Ongoing, label: t.ongoing },
    { value: EventStatus.Past, label: t.past },
  ];

  const presets = [
    { id: 'nowPlus1h', label: t.nowPlus1h },
    { id: 'tonight', label: t.tonight },
    { id: 'tomorrow', label: t.tomorrow },
    { id: 'weekend', label: t.weekend },
    { id: 'next7days', label: t.next7days },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Header - Simplified */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t.title}
          </h2>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-md bg-indigo-600 text-white">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {t.clearAll}
            </button>
          )}
          {/* Hide button for desktop (when not a drawer) */}
          {!isDrawer && onHide && (
            <button
              onClick={onHide}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Hide filters"
              title="Hide filters"
            >
              <ChevronDown className="w-4 h-4 text-zinc-500 -rotate-90" />
            </button>
          )}
          {/* Close button for drawer (mobile) */}
          {isDrawer && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          )}
        </div>
      </div>

      {/* Loading indicator - moved to content area */}
      {isPending && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="font-medium">Updating results...</span>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Time Status */}
          <CollapsibleSection
            title={t.timeStatus}
            icon={
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            }
            isOpen={openSections.timeStatus}
            onToggle={() => toggleSection('timeStatus')}
            badge={timeStatusBadge}
          >
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleStatusChange(value)}
                  className={`px-3 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                    filters.status === value
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CollapsibleSection>

          {/* Date Range */}
          <CollapsibleSection
            title={t.dateRange}
            icon={
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            }
            isOpen={openSections.dateRange}
            onToggle={() => toggleSection('dateRange')}
            badge={dateRangeBadge}
          >
            {dateInputsDisabled && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                {t.dateRangeDisabled}
              </p>
            )}

            {/* Presets - Compact */}
            <div
              className={`flex flex-wrap gap-1.5 mb-3 transition-opacity ${
                dateInputsDisabled ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              {presets.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handlePresetClick(id)}
                  disabled={dateInputsDisabled}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-zinc-100 text-zinc-700 hover:bg-indigo-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-indigo-600 transition-colors disabled:cursor-not-allowed"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs - Cleaner */}
            <div
              className={`space-y-2.5 transition-opacity ${
                dateInputsDisabled ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  {t.startDate}
                </label>
                <input
                  type="datetime-local"
                  value={isoToLocalInput(filters.startISO)}
                  onChange={(e) => handleStartChange(e.target.value)}
                  disabled={dateInputsDisabled}
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-zinc-200 rounded-lg dark:border-zinc-700 dark:bg-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  {t.endDate}
                </label>
                <input
                  type="datetime-local"
                  value={isoToLocalInput(filters.endISO)}
                  min={isoToLocalInput(filters.startISO) || undefined}
                  onChange={(e) => handleEndChange(e.target.value)}
                  disabled={dateInputsDisabled}
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-zinc-200 rounded-lg dark:border-zinc-700 dark:bg-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Meeting Type - Simplified colors */}
          <CollapsibleSection
            title={t.meetingType}
            icon={
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            }
            isOpen={openSections.meetingType}
            onToggle={() => toggleSection('meetingType')}
            badge={meetingTypeBadge}
          >
            <div className="space-y-1.5">
              <button
                onClick={() => toggleKind(MeetingKind.Onsite)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border-2 transition-all ${
                  filters.kinds.includes(MeetingKind.Onsite)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{t.onsite}</span>
                {filters.kinds.includes(MeetingKind.Onsite) && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>

              <button
                onClick={() => toggleKind(MeetingKind.Online)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border-2 transition-all ${
                  filters.kinds.includes(MeetingKind.Online)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <Laptop className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{t.online}</span>
                {filters.kinds.includes(MeetingKind.Online) && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>

              <button
                onClick={() => toggleKind(MeetingKind.Hybrid)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border-2 transition-all ${
                  filters.kinds.includes(MeetingKind.Hybrid)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{t.hybrid}</span>
                {filters.kinds.includes(MeetingKind.Hybrid) && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>
            </div>
          </CollapsibleSection>

          {/* Level - Unified colors */}
          <CollapsibleSection
            title={t.level}
            icon={
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            }
            isOpen={openSections.level}
            onToggle={() => toggleSection('level')}
            badge={levelBadge}
          >
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleLevel(Level.Beginner)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  filters.levels.includes(Level.Beginner)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                {t.beginner}
              </button>
              <button
                onClick={() => toggleLevel(Level.Intermediate)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  filters.levels.includes(Level.Intermediate)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                {t.intermediate}
              </button>
              <button
                onClick={() => toggleLevel(Level.Advanced)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  filters.levels.includes(Level.Advanced)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                {t.advanced}
              </button>
            </div>
          </CollapsibleSection>

          {/* Join Mode - Unified colors */}
          <CollapsibleSection
            title={t.joinMode}
            icon={
              <DoorOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            }
            isOpen={openSections.joinMode}
            onToggle={() => toggleSection('joinMode')}
            badge={joinModeBadge}
          >
            <div className="space-y-1.5">
              <button
                onClick={() => toggleJoinMode(JoinMode.Open)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border-2 transition-all ${
                  filters.joinModes.includes(JoinMode.Open)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <DoorOpen className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{t.open}</span>
                {filters.joinModes.includes(JoinMode.Open) && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>
              <button
                onClick={() => toggleJoinMode(JoinMode.Request)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border-2 transition-all ${
                  filters.joinModes.includes(JoinMode.Request)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{t.request}</span>
                {filters.joinModes.includes(JoinMode.Request) && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>
              <button
                onClick={() => toggleJoinMode(JoinMode.InviteOnly)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border-2 transition-all ${
                  filters.joinModes.includes(JoinMode.InviteOnly)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{t.inviteOnly}</span>
                {filters.joinModes.includes(JoinMode.InviteOnly) && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>
            </div>
          </CollapsibleSection>

          {/* Verified Organizer - Cleaner toggle */}
          <CollapsibleSection
            title={t.organizer}
            icon={
              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            }
            isOpen={openSections.organizer}
            onToggle={() => toggleSection('organizer')}
            badge={organizerBadge}
          >
            <button
              onClick={() => handleVerifiedChange(!filters.verifiedOnly)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                filters.verifiedOnly
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:border-zinc-600'
              }`}
            >
              <span
                className={`text-sm font-medium ${filters.verifiedOnly ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}
              >
                {t.verifiedOnly}
              </span>
              <div
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${filters.verifiedOnly ? 'bg-white/30' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              >
                <span
                  className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${filters.verifiedOnly ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </div>
            </button>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
});

export default LeftFiltersPanel;
