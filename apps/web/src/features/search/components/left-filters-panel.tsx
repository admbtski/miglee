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
  Clock,
  Calendar,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useTranslations } from '@/lib/i18n/provider-ssr';
import type { CommittedFilters } from '@/features/events';

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
    <section className="border-b border-zinc-200/60 dark:border-zinc-800/60 pb-5 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-1.5 group hover:opacity-70 transition-opacity"
        aria-expanded={isOpen}
      >
        <h3 className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
          {icon}
          <span className="tracking-wide uppercase">{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
              {badge}
            </span>
          )}
        </h3>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-300 ${
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
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3.5">{children}</div>
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
      {/* Header - Clean & Minimal */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {t.title}
          </h2>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-2 text-[11px] font-bold rounded-full bg-indigo-600 text-white">
              {activeFiltersCount}
            </span>
          )}
          {isPending && (
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md transition-colors"
            >
              {t.clearAll}
            </button>
          )}
          {/* Hide button for desktop (when not a drawer) */}
          {!isDrawer && onHide && (
            <button
              onClick={onHide}
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close filters"
            >
              <X className="w-4.5 h-4.5 text-zinc-500" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
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
                  className={`px-3.5 py-2 text-sm font-mono rounded-lg transition-all ${
                    filters.status === value
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800/80'
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
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 mb-3 p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                <span>ℹ️</span>
                <span>{t.dateRangeDisabled}</span>
              </div>
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
                  className="px-2.5 py-1.5 text-xs font-mono rounded-md bg-zinc-100 text-zinc-700 hover:bg-indigo-600 hover:text-white dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-indigo-600 transition-all disabled:cursor-not-allowed"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            <div
              className={`space-y-2.5 transition-opacity ${
                dateInputsDisabled ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {t.startDate}
                </label>
                <input
                  type="datetime-local"
                  value={isoToLocalInput(filters.startISO)}
                  onChange={(e) => handleStartChange(e.target.value)}
                  disabled={dateInputsDisabled}
                  className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg dark:border-zinc-600 dark:bg-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {t.endDate}
                </label>
                <input
                  type="datetime-local"
                  value={isoToLocalInput(filters.endISO)}
                  min={isoToLocalInput(filters.startISO) || undefined}
                  onChange={(e) => handleEndChange(e.target.value)}
                  disabled={dateInputsDisabled}
                  className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg dark:border-zinc-600 dark:bg-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Meeting Type */}
          <CollapsibleSection
            title={t.meetingType}
            icon={
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            }
            isOpen={openSections.meetingType}
            onToggle={() => toggleSection('meetingType')}
            badge={meetingTypeBadge}
          >
            <div className="space-y-2">
              <FilterButton
                icon={<MapPin className="w-4 h-4" />}
                label={t.onsite}
                active={filters.kinds.includes(MeetingKind.Onsite)}
                onClick={() => toggleKind(MeetingKind.Onsite)}
              />
              <FilterButton
                icon={<Laptop className="w-4 h-4" />}
                label={t.online}
                active={filters.kinds.includes(MeetingKind.Online)}
                onClick={() => toggleKind(MeetingKind.Online)}
              />
              <FilterButton
                icon={<Globe className="w-4 h-4" />}
                label={t.hybrid}
                active={filters.kinds.includes(MeetingKind.Hybrid)}
                onClick={() => toggleKind(MeetingKind.Hybrid)}
              />
            </div>
          </CollapsibleSection>

          {/* Level */}
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
              <FilterChip
                label={t.beginner}
                active={filters.levels.includes(Level.Beginner)}
                onClick={() => toggleLevel(Level.Beginner)}
              />
              <FilterChip
                label={t.intermediate}
                active={filters.levels.includes(Level.Intermediate)}
                onClick={() => toggleLevel(Level.Intermediate)}
              />
              <FilterChip
                label={t.advanced}
                active={filters.levels.includes(Level.Advanced)}
                onClick={() => toggleLevel(Level.Advanced)}
              />
            </div>
          </CollapsibleSection>

          {/* Join Mode */}
          <CollapsibleSection
            title={t.joinMode}
            icon={
              <DoorOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            }
            isOpen={openSections.joinMode}
            onToggle={() => toggleSection('joinMode')}
            badge={joinModeBadge}
          >
            <div className="space-y-2">
              <FilterButton
                icon={<DoorOpen className="w-4 h-4" />}
                label={t.open}
                active={filters.joinModes.includes(JoinMode.Open)}
                onClick={() => toggleJoinMode(JoinMode.Open)}
              />
              <FilterButton
                icon={<Users className="w-4 h-4" />}
                label={t.request}
                active={filters.joinModes.includes(JoinMode.Request)}
                onClick={() => toggleJoinMode(JoinMode.Request)}
              />
              <FilterButton
                icon={<Lock className="w-4 h-4" />}
                label={t.inviteOnly}
                active={filters.joinModes.includes(JoinMode.InviteOnly)}
                onClick={() => toggleJoinMode(JoinMode.InviteOnly)}
              />
            </div>
          </CollapsibleSection>

          {/* Verified Organizer */}
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                filters.verifiedOnly
                  ? 'bg-indigo-600 shadow-md shadow-indigo-500/25'
                  : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/80'
              }`}
            >
              <span
                className={`text-sm font-semibold ${filters.verifiedOnly ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}
              >
                {t.verifiedOnly}
              </span>
              <div
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${filters.verifiedOnly ? 'bg-white/25' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              >
                <span
                  className={`absolute h-5 w-5 rounded-full shadow-sm transition-all ${filters.verifiedOnly ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-white'}`}
                />
              </div>
            </button>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
});

// Reusable FilterButton component for consistency
type FilterButtonProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
};

function FilterButton({ icon, label, active, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
          : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800/80'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-sm font-mono flex-1 text-left">{label}</span>
      {active && <Check className="w-4 h-4 flex-shrink-0" />}
    </button>
  );
}

// Reusable FilterChip component for tags/pills
type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-lg text-sm font-mono transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
          : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800/80'
      }`}
    >
      {label}
    </button>
  );
}

export default LeftFiltersPanel;
