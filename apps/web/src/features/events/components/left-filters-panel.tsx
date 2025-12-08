/**
 * Left Filters Panel - Desktop sidebar / Mobile drawer with filters
 * Contains: Time Status, Date Range, Meeting Type, Level, Join Mode, Verified Organizer
 * All sections are collapsible with default open state
 */

'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  IntentStatus,
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
  Sparkles,
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
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 group"
        aria-expanded={isOpen}
      >
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          {icon}
          {title}
          {badge !== undefined && badge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
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
            <div className="pt-2 pb-1">{children}</div>
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
    filters.status === IntentStatus.Upcoming ||
    filters.status === IntentStatus.Ongoing ||
    filters.status === IntentStatus.Past;

  // Time Status change handler
  const handleStatusChange = useCallback(
    (newStatus: IntentStatus) => {
      const updates: Partial<CommittedFilters> = { status: newStatus };
      if (
        newStatus === IntentStatus.Upcoming ||
        newStatus === IntentStatus.Ongoing ||
        newStatus === IntentStatus.Past
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
      if (iso !== null && filters.status !== IntentStatus.Any) {
        updates.status = IntentStatus.Any;
      }
      onFiltersChange(updates);
    },
    [onFiltersChange, filters.status]
  );

  const handleEndChange = useCallback(
    (val: string) => {
      const iso = localInputToISO(val);
      const updates: Partial<CommittedFilters> = { endISO: iso };
      if (iso !== null && filters.status !== IntentStatus.Any) {
        updates.status = IntentStatus.Any;
      }
      onFiltersChange(updates);
    },
    [onFiltersChange, filters.status]
  );

  const handlePresetClick = useCallback(
    (preset: string) => {
      const { start, end } = getPresetDates(preset);
      onFiltersChange({
        status: IntentStatus.Any,
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
      status: IntentStatus.Any,
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
    if (filters.status !== IntentStatus.Any) count++;
    if (filters.startISO || filters.endISO) count++;
    count += filters.kinds.length;
    count += filters.levels.length;
    count += filters.joinModes.length;
    if (filters.verifiedOnly) count++;
    return count;
  }, [filters]);

  // Section badges
  const timeStatusBadge = filters.status !== IntentStatus.Any ? 1 : 0;
  const dateRangeBadge = filters.startISO || filters.endISO ? 1 : 0;
  const meetingTypeBadge = filters.kinds.length;
  const levelBadge = filters.levels.length;
  const joinModeBadge = filters.joinModes.length;
  const organizerBadge = filters.verifiedOnly ? 1 : 0;

  const statusOptions = [
    { value: IntentStatus.Any, label: t.any },
    { value: IntentStatus.Upcoming, label: t.upcoming },
    { value: IntentStatus.Ongoing, label: t.ongoing },
    { value: IntentStatus.Past, label: t.past },
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {t.title}
          </h2>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm">
              {activeFiltersCount}
            </span>
          )}
          {isPending && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full dark:text-amber-300 dark:bg-amber-900/40 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
            >
              {t.clearAll}
            </button>
          )}
          {isDrawer && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content with custom scrollbar */}
      <div className="flex-1 overflow-y-auto filters-scrollbar">
        <div className="p-4 space-y-1">
          {/* Time Status */}
          <CollapsibleSection
            title={t.timeStatus}
            icon={<Clock className="w-4 h-4 text-cyan-500" />}
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
                  className={`px-3 py-2 text-sm font-medium rounded-xl border transition-all ${
                    filters.status === value
                      ? 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-300'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CollapsibleSection>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800 my-3" />

          {/* Date Range */}
          <CollapsibleSection
            title={t.dateRange}
            icon={<Calendar className="w-4 h-4 text-emerald-500" />}
            isOpen={openSections.dateRange}
            onToggle={() => toggleSection('dateRange')}
            badge={dateRangeBadge}
          >
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              {dateInputsDisabled ? t.dateRangeDisabled : t.dateRangeHint}
            </p>

            {/* Presets */}
            <div
              className={`flex flex-wrap gap-1.5 mb-3 transition-opacity ${
                dateInputsDisabled ? 'opacity-50 pointer-events-none' : ''
              }`}
              aria-disabled={dateInputsDisabled}
            >
              {presets.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handlePresetClick(id)}
                  disabled={dateInputsDisabled}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border bg-white text-zinc-600 border-zinc-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-emerald-900/30 dark:hover:border-emerald-800 dark:hover:text-emerald-300 transition-all disabled:cursor-not-allowed"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            <div
              className={`space-y-3 transition-opacity ${
                dateInputsDisabled ? 'opacity-50 pointer-events-none' : ''
              }`}
              aria-disabled={dateInputsDisabled}
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
                  aria-disabled={dateInputsDisabled}
                  className="w-full px-3 py-2 text-sm bg-white border rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all disabled:cursor-not-allowed"
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
                  aria-disabled={dateInputsDisabled}
                  className="w-full px-3 py-2 text-sm bg-white border rounded-xl border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800 my-3" />

          {/* Meeting Type */}
          <CollapsibleSection
            title={t.meetingType}
            icon={<Globe className="w-4 h-4 text-violet-500" />}
            isOpen={openSections.meetingType}
            onToggle={() => toggleSection('meetingType')}
            badge={meetingTypeBadge}
          >
            <div className="space-y-2">
              <button
                onClick={() => toggleKind(MeetingKind.Onsite)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                  filters.kinds.includes(MeetingKind.Onsite)
                    ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <MapPin
                  className={`w-4 h-4 ${filters.kinds.includes(MeetingKind.Onsite) ? 'text-rose-500' : 'text-zinc-400'}`}
                />
                <span className="text-sm font-medium flex-1 text-left">
                  {t.onsite}
                </span>
                {filters.kinds.includes(MeetingKind.Onsite) && (
                  <Check className="w-4 h-4 text-rose-500" />
                )}
              </button>

              <button
                onClick={() => toggleKind(MeetingKind.Online)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                  filters.kinds.includes(MeetingKind.Online)
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <Laptop
                  className={`w-4 h-4 ${filters.kinds.includes(MeetingKind.Online) ? 'text-blue-500' : 'text-zinc-400'}`}
                />
                <span className="text-sm font-medium flex-1 text-left">
                  {t.online}
                </span>
                {filters.kinds.includes(MeetingKind.Online) && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>

              <button
                onClick={() => toggleKind(MeetingKind.Hybrid)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                  filters.kinds.includes(MeetingKind.Hybrid)
                    ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <Globe
                  className={`w-4 h-4 ${filters.kinds.includes(MeetingKind.Hybrid) ? 'text-violet-500' : 'text-zinc-400'}`}
                />
                <span className="text-sm font-medium flex-1 text-left">
                  {t.hybrid}
                </span>
                {filters.kinds.includes(MeetingKind.Hybrid) && (
                  <Check className="w-4 h-4 text-violet-500" />
                )}
              </button>
            </div>
          </CollapsibleSection>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800 my-3" />

          {/* Level */}
          <CollapsibleSection
            title={t.level}
            icon={<GraduationCap className="w-4 h-4 text-amber-500" />}
            isOpen={openSections.level}
            onToggle={() => toggleSection('level')}
            badge={levelBadge}
          >
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleLevel(Level.Beginner)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                  filters.levels.includes(Level.Beginner)
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-300'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {t.beginner}
              </button>
              <button
                onClick={() => toggleLevel(Level.Intermediate)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                  filters.levels.includes(Level.Intermediate)
                    ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-300'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {t.intermediate}
              </button>
              <button
                onClick={() => toggleLevel(Level.Advanced)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                  filters.levels.includes(Level.Advanced)
                    ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {t.advanced}
              </button>
            </div>
          </CollapsibleSection>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800 my-3" />

          {/* Join Mode */}
          <CollapsibleSection
            title={t.joinMode}
            icon={<DoorOpen className="w-4 h-4 text-green-500" />}
            isOpen={openSections.joinMode}
            onToggle={() => toggleSection('joinMode')}
            badge={joinModeBadge}
          >
            <div className="space-y-2">
              <button
                onClick={() => toggleJoinMode(JoinMode.Open)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                  filters.joinModes.includes(JoinMode.Open)
                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <DoorOpen
                  className={`w-4 h-4 ${filters.joinModes.includes(JoinMode.Open) ? 'text-green-500' : 'text-zinc-400'}`}
                />
                <span className="text-sm font-medium flex-1 text-left">
                  {t.open}
                </span>
                {filters.joinModes.includes(JoinMode.Open) && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </button>
              <button
                onClick={() => toggleJoinMode(JoinMode.Request)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                  filters.joinModes.includes(JoinMode.Request)
                    ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <Users
                  className={`w-4 h-4 ${filters.joinModes.includes(JoinMode.Request) ? 'text-orange-500' : 'text-zinc-400'}`}
                />
                <span className="text-sm font-medium flex-1 text-left">
                  {t.request}
                </span>
                {filters.joinModes.includes(JoinMode.Request) && (
                  <Check className="w-4 h-4 text-orange-500" />
                )}
              </button>
              <button
                onClick={() => toggleJoinMode(JoinMode.InviteOnly)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                  filters.joinModes.includes(JoinMode.InviteOnly)
                    ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <Lock
                  className={`w-4 h-4 ${filters.joinModes.includes(JoinMode.InviteOnly) ? 'text-purple-500' : 'text-zinc-400'}`}
                />
                <span className="text-sm font-medium flex-1 text-left">
                  {t.inviteOnly}
                </span>
                {filters.joinModes.includes(JoinMode.InviteOnly) && (
                  <Check className="w-4 h-4 text-purple-500" />
                )}
              </button>
            </div>
          </CollapsibleSection>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800 my-3" />

          {/* Verified Organizer */}
          <CollapsibleSection
            title={t.organizer}
            icon={<UserCheck className="w-4 h-4 text-indigo-500" />}
            isOpen={openSections.organizer}
            onToggle={() => toggleSection('organizer')}
            badge={organizerBadge}
          >
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              {t.verifiedHint}
            </p>
            <button
              onClick={() => handleVerifiedChange(!filters.verifiedOnly)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${
                filters.verifiedOnly
                  ? 'bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200 dark:from-indigo-900/30 dark:to-violet-900/30 dark:border-indigo-800'
                  : 'bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800'
              }`}
            >
              <span
                className={`text-sm font-medium ${filters.verifiedOnly ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'}`}
              >
                {t.verifiedOnly}
              </span>
              <span
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${filters.verifiedOnly ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              >
                <span
                  className={`absolute h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${filters.verifiedOnly ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </span>
            </button>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
});

export default LeftFiltersPanel;
