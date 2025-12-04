/**
 * Left Filters Panel - Desktop sidebar with Event Settings filters
 * Contains: Meeting Type, Level, Join Mode, Verified Organizer
 * (Time Status and Date Range moved to TopDrawer)
 */

'use client';

import { memo, useCallback, useMemo } from 'react';
import {
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
} from 'lucide-react';
import type { CommittedFilters } from '../_types';

export type LeftFiltersPanelProps = {
  filters: CommittedFilters;
  onFiltersChange: (next: Partial<CommittedFilters>) => void;
  locale?: 'pl' | 'en';
  isDrawer?: boolean;
  onClose?: () => void;
  isPending?: boolean; // Shows when filters are waiting to be applied
};

const translations = {
  pl: {
    title: 'Filtry',
    clearAll: 'Wyczyść',
    meetingType: 'Tryb spotkania',
    onsite: 'Stacjonarne',
    online: 'Online',
    hybrid: 'Hybrydowe',
    level: 'Poziom',
    beginner: 'Początkujący',
    intermediate: 'Średniozaawansowany',
    advanced: 'Zaawansowany',
    joinMode: 'Tryb dołączania',
    open: 'Otwarte',
    request: 'Na prośbę',
    inviteOnly: 'Tylko zaproszenia',
    organizer: 'Organizator',
    verifiedOnly: 'Tylko zweryfikowani',
    verifiedHint: 'Pokaż tylko wydarzenia od zweryfikowanych organizatorów',
  },
  en: {
    title: 'Filters',
    clearAll: 'Clear',
    meetingType: 'Meeting Type',
    onsite: 'Onsite',
    online: 'Online',
    hybrid: 'Hybrid',
    level: 'Level',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    joinMode: 'Join Mode',
    open: 'Open',
    request: 'Request',
    inviteOnly: 'Invite Only',
    organizer: 'Organizer',
    verifiedOnly: 'Verified only',
    verifiedHint: 'Show only events from verified organizers',
  },
};

export const LeftFiltersPanel = memo(function LeftFiltersPanel({
  filters,
  onFiltersChange,
  locale = 'pl',
  isDrawer = false,
  onClose,
  isPending = false,
}: LeftFiltersPanelProps) {
  const t = translations[locale];

  // Toggle handlers for multi-select filters
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
      kinds: [],
      levels: [],
      joinModes: [],
      verifiedOnly: false,
    });
  }, [onFiltersChange]);

  // Count active filters in this panel
  const activeFiltersCount = useMemo(() => {
    return (
      filters.kinds.length +
      filters.levels.length +
      filters.joinModes.length +
      (filters.verifiedOnly ? 1 : 0)
    );
  }, [filters]);

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
              <span className="hidden sm:inline">Oczekuje...</span>
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-5">
          {/* Meeting Type */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-500" />
              {t.meetingType}
            </h3>
            <div className="space-y-2">
              {/* Onsite */}
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

              {/* Online */}
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

              {/* Hybrid */}
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
          </section>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />

          {/* Level */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              {t.level}
            </h3>
            <div className="flex flex-wrap gap-2">
              {/* Beginner */}
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

              {/* Intermediate */}
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

              {/* Advanced */}
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
          </section>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />

          {/* Join Mode */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-green-500" />
              {t.joinMode}
            </h3>
            <div className="space-y-2">
              {/* Open */}
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

              {/* Request */}
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

              {/* Invite Only */}
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
          </section>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />

          {/* Verified Organizer */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-500" />
              {t.organizer}
            </h3>
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
                className={`text-sm font-medium ${
                  filters.verifiedOnly
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {t.verifiedOnly}
              </span>
              <span
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
                  filters.verifiedOnly
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600'
                    : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`absolute h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    filters.verifiedOnly ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
});

export default LeftFiltersPanel;
