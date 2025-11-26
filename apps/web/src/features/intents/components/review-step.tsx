// app/(wherever)/ReviewStep.tsx
'use client';

import { MapPreview } from '@/features/maps/components/map-preview';
import {
  CalendarDays,
  Clock,
  ClockFading,
  Eye,
  EyeOff,
  FileQuestion,
  FolderIcon,
  Gauge,
  Globe2,
  HashIcon,
  LinkIcon,
  MapPin,
  NotebookText,
  Rocket,
  Ruler,
  Sprout,
  User,
  UserCheck,
  Users,
  Sparkles,
  Crown,
  Info,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';
import { useCategorySelection } from './category-selection-provider';
import { useTagSelection } from './tag-selection-provider';
import { IntentFormValues } from './types';
import {
  AddressVisibility,
  Level,
  MembersVisibility,
} from '@/lib/api/__generated__/react-query-update';
import { LevelBadge } from '@/components/ui/level-badge';
import { twMerge } from 'tailwind-merge';
import type { JoinFormQuestion } from './join-form-step';
import { useMeQuery } from '@/lib/api/auth';

/* ---------- Section header ---------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold tracking-tight">{children}</h4>
    </div>
  );
}

/* ---------- Chip with sizing & variants (like LevelBadge) ---------- */

export type ChipSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ChipVariant = 'icon' | 'iconText' | 'text';

type ChipTone =
  | 'zinc'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'blue'
  | 'cyan'
  | 'teal'
  | 'lime'
  | 'orange'
  | 'fuchsia';

const CHIP_TONE_CLASSES: Record<ChipTone, string> = {
  zinc: 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-200 dark:ring-zinc-700',
  indigo:
    'bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-500/25',
  emerald:
    'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/25',
  amber:
    'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/25',
  rose: 'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-500/25',
  violet:
    'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/25',
  blue: 'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-500/25',
  cyan: 'bg-cyan-100 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-200 dark:ring-cyan-500/25',
  teal: 'bg-teal-100 text-teal-700 ring-teal-200 dark:bg-teal-500/15 dark:text-teal-200 dark:ring-teal-500/25',
  lime: 'bg-lime-100 text-lime-800 ring-lime-200 dark:bg-lime-500/15 dark:text-lime-200 dark:ring-lime-500/25',
  orange:
    'bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-500/25',
  fuchsia:
    'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-200 dark:ring-fuchsia-500/25',
};

const CHIP_SIZE_STYLES: Record<
  ChipSize,
  { container: string; icon: string; text: string; gap: string }
> = {
  xs: {
    container: 'px-1.5 py-0.5 rounded-full',
    icon: 'w-3 h-3',
    text: 'text-[10px] leading-none',
    gap: 'gap-1',
  },
  sm: {
    container: 'px-2 py-0.5 rounded-full',
    icon: 'w-3.5 h-3.5',
    text: 'text-[11px] leading-none',
    gap: 'gap-1.5',
  },
  md: {
    container: 'px-2.5 py-0.5 rounded-full',
    icon: 'w-4 h-4',
    text: 'text-xs leading-none',
    gap: 'gap-1.5',
  },
  lg: {
    container: 'px-3 py-0.5 rounded-full',
    icon: 'w-5 h-5',
    text: 'text-sm leading-none',
    gap: 'gap-2',
  },
  xl: {
    container: 'px-3.5 py-1 rounded-full',
    icon: 'w-6 h-6',
    text: 'text-base leading-none',
    gap: 'gap-2',
  },
};

function Chip({
  children,
  tone = 'zinc',
  icon,
  size = 'md',
  variant = 'iconText',
  className,
  title,
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  icon?: React.ReactNode;
  size?: ChipSize;
  variant?: ChipVariant;
  className?: string;
  title?: string;
}) {
  const S = CHIP_SIZE_STYLES[size];

  if (variant === 'text') {
    return (
      <span
        className={['inline-flex items-center truncate', S.text, className]
          .filter(Boolean)
          .join(' ')}
        title={title ?? (typeof children === 'string' ? children : undefined)}
      >
        {children}
      </span>
    );
  }

  const base =
    'inline-flex items-center ring-1 shadow-sm select-none bg-white/80 dark:bg-zinc-900/60 truncate';
  const ibase = 'flex items-center';
  const toneCls = CHIP_TONE_CLASSES[tone] ?? CHIP_TONE_CLASSES.zinc;

  if (variant === 'icon') {
    return (
      <span
        className={[base, toneCls, S.container, className]
          .filter(Boolean)
          .join(' ')}
        title={title ?? (typeof children === 'string' ? children : undefined)}
        aria-label={
          title ?? (typeof children === 'string' ? children : undefined)
        }
      >
        {icon ? <span className={twMerge(S.icon, ibase)}>{icon}</span> : null}
      </span>
    );
  }

  // default: icon + text
  return (
    <span
      className={[base, toneCls, S.container, S.gap, className]
        .filter(Boolean)
        .join(' ')}
      title={title ?? (typeof children === 'string' ? children : undefined)}
    >
      {icon ? <span className={twMerge(S.icon, ibase)}>{icon}</span> : null}
      <span className={['font-medium truncate', S.text].join(' ')}>
        {children}
      </span>
    </span>
  );
}

/* ---------- KVP row ---------- */

function Kvp({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[28px_1fr] items-start gap-3">
      <div className="grid rounded-md h-7 w-7 place-items-center bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-200 dark:ring-zinc-700">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </div>
        <div
          className={[
            'text-sm text-zinc-900 dark:text-zinc-100',
            mono ? 'font-mono tabular-nums' : '',
          ].join(' ')}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function useFormattedTime(start: Date, end: Date) {
  return useMemo(() => {
    try {
      const dDate = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        weekday: 'short',
      }).format(start);

      const t = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });

      const startT = t.format(start);
      const endT = t.format(end);

      return { dDate, startT, endT };
    } catch {
      return {
        dDate: start.toLocaleDateString(),
        startT: start.toLocaleTimeString(),
        endT: end.toLocaleTimeString(),
      };
    }
  }, [start, end]);
}

function Coordinates({ lat, lng }: { lat: number; lng: number }) {
  return (
    <span className="font-mono text-xs tabular-nums opacity-80">
      ({lat.toFixed(4)}, {lng.toFixed(4)})
    </span>
  );
}

/* ---------- main component ---------- */

export function ReviewStep({
  values,
  showMapPreview = false,
  mapId,
  showSuggestion,
  errors,
  onEditStep,
  joinFormQuestions,
}: {
  values: IntentFormValues;
  showMapPreview?: boolean;
  mapId?: string;
  showSuggestion?: boolean;
  errors?: Record<string, { message?: string }>;
  onEditStep?: (stepIndex: number) => void;
  joinFormQuestions?: JoinFormQuestion[];
}) {
  const { dDate, startT, endT } = useFormattedTime(
    values.startAt,
    values.endAt
  );

  const { selected: selectedCategories } = useCategorySelection();
  const { selected: selectedTags } = useTagSelection();

  // Get current user's plan
  const { data: authData } = useMeQuery();
  const userPlan = authData?.me?.effectivePlan || 'FREE';

  // Back-compat: mapujemy ewentualny showAddress -> AddressVisibility
  const resolvedAddressVis: AddressVisibility =
    (values as any).addressVisibility ??
    ((values as any).showAddress
      ? AddressVisibility.Public
      : AddressVisibility.Hidden);

  const resolvedMembersVis: MembersVisibility =
    (values as any).membersVisibility ?? MembersVisibility.Public;

  const modeChip =
    values.mode === 'ONE_TO_ONE' ? (
      <Chip tone="violet" icon={<User className="h-3.5 w-3.5" />}>
        1:1
      </Chip>
    ) : (
      <Chip tone="indigo" icon={<Users className="h-3.5 w-3.5" />}>
        Group {values.min}–{values.max}
      </Chip>
    );

  const visChip =
    values.visibility === 'PUBLIC' ? (
      <Chip tone="emerald" icon={<Eye className="h-3.5 w-3.5" />}>
        Public
      </Chip>
    ) : (
      <Chip tone="amber" icon={<EyeOff className="h-3.5 w-3.5" />}>
        Hidden
      </Chip>
    );

  const meetingKindChip =
    values.meetingKind === 'HYBRID' ? (
      <Chip tone="orange" icon={<Globe2 className="h-3.5 w-3.5" />}>
        HYBRID
      </Chip>
    ) : values.meetingKind === 'ONLINE' ? (
      <Chip tone="cyan" icon={<LinkIcon className="h-3.5 w-3.5" />}>
        ONLINE
      </Chip>
    ) : (
      <Chip tone="teal" icon={<MapPin className="h-3.5 w-3.5" />}>
        ONSITE
      </Chip>
    );

  const joinModeChip =
    values.joinMode === 'OPEN' ? (
      <Chip tone="emerald" icon={<Users className="h-3.5 w-3.5" />}>
        Otwarty dostęp
      </Chip>
    ) : values.joinMode === 'REQUEST' ? (
      <Chip tone="amber" icon={<UserCheck className="h-3.5 w-3.5" />}>
        Na żądanie
      </Chip>
    ) : (
      <Chip tone="rose" icon={<LinkIcon className="h-3.5 w-3.5" />}>
        Tylko zaproszenia
      </Chip>
    );

  // Address & members visibility chips
  const addressVisChip =
    resolvedAddressVis === AddressVisibility.Public ? (
      <Chip tone="emerald" icon={<Eye className="h-3.5 w-3.5" />}>
        Adres: Publiczny
      </Chip>
    ) : resolvedAddressVis === AddressVisibility.AfterJoin ? (
      <Chip tone="blue" icon={<UserCheck className="h-3.5 w-3.5" />}>
        Adres: Po dołączeniu
      </Chip>
    ) : (
      <Chip tone="zinc" icon={<EyeOff className="h-3.5 w-3.5" />}>
        Adres: Ukryty
      </Chip>
    );

  const membersVisChip =
    resolvedMembersVis === MembersVisibility.Public ? (
      <Chip tone="emerald" icon={<Users className="h-3.5 w-3.5" />}>
        Uczestnicy: Publiczna lista
      </Chip>
    ) : resolvedMembersVis === MembersVisibility.AfterJoin ? (
      <Chip tone="blue" icon={<UserCheck className="h-3.5 w-3.5" />}>
        Uczestnicy: Po dołączeniu
      </Chip>
    ) : (
      <Chip tone="zinc" icon={<EyeOff className="h-3.5 w-3.5" />}>
        Uczestnicy: Ukryta lista
      </Chip>
    );

  const hasCoords =
    typeof values.location?.lat === 'number' &&
    typeof values.location?.lng === 'number';

  const where =
    values.location.address && values.location.address.trim().length > 0 ? (
      <>
        <span className="break-words">{values.location.address}</span>{' '}
        {hasCoords && (
          <Coordinates lat={values.location.lat!} lng={values.location.lng!} />
        )}
      </>
    ) : hasCoords ? (
      <Coordinates lat={values.location.lat!} lng={values.location.lng!} />
    ) : (
      '—'
    );

  const onlineUrl = values.onlineUrl ? (
    <a
      href={values.onlineUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:opacity-80"
    >
      Otwórz link do spotkania
    </a>
  ) : (
    '—'
  );

  const center = hasCoords
    ? { lat: values.location.lat!, lng: values.location.lng! }
    : null;

  const radiusMeters =
    typeof values.location?.radiusKm === 'number' &&
    values.location.radiusKm > 0
      ? values.location.radiusKm * 1000
      : null;

  // Level chips (via LevelBadge)
  const levelChips =
    Array.isArray(values.levels) && values.levels.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {values.levels.map((lv) => (
          <LevelBadge key={lv} level={lv as Level} size="md" />
        ))}
      </div>
    ) : null;

  // Map field names to step indices and labels
  const fieldToStep: Record<string, { step: number; label: string }> = {
    title: { step: 0, label: 'Event name' },
    categorySlugs: { step: 0, label: 'Categories' },
    description: { step: 0, label: 'Description' },
    tagSlugs: { step: 0, label: 'Tags' },
    mode: { step: 0, label: 'Mode' },
    min: { step: 0, label: 'Minimum capacity' },
    max: { step: 0, label: 'Maximum capacity' },
    startAt: { step: 1, label: 'Start time' },
    endAt: { step: 1, label: 'End time' },
    meetingKind: { step: 1, label: 'Meeting type' },
    onlineUrl: { step: 1, label: 'Online URL' },
    location: { step: 1, label: 'Location' },
    notes: { step: 1, label: 'Logistics note' },
    joinMode: { step: 2, label: 'Join mode' },
    visibility: { step: 2, label: 'Visibility' },
    levels: { step: 2, label: 'Participant levels' },
    addressVisibility: { step: 2, label: 'Address visibility' },
    membersVisibility: { step: 2, label: 'Members visibility' },
  };

  const validationErrors = errors
    ? Object.entries(errors)
        .filter(([_, err]) => err?.message)
        .map(([field, err]) => ({
          field,
          message: err.message as string,
          step: fieldToStep[field]?.step ?? 0,
          label: fieldToStep[field]?.label ?? field,
        }))
    : [];

  return (
    <div className={`grid gap-5 ${showSuggestion && 'md:grid-cols-2'}`}>
      {/* Validation Summary */}
      {validationErrors.length > 0 && (
        <div className="p-4 border border-red-300 col-span-full rounded-2xl bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-red-700 dark:text-red-300">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            Please fix {validationErrors.length} issue
            {validationErrors.length !== 1 ? 's' : ''} before creating
          </div>
          <ul className="space-y-1.5">
            {validationErrors.map(({ field, message, step, label }) => (
              <li
                key={field}
                className="text-sm text-red-800 dark:text-red-200"
              >
                {onEditStep ? (
                  <button
                    type="button"
                    onClick={() => onEditStep(step)}
                    className="text-left hover:underline"
                  >
                    <strong>{label}:</strong> {message}
                  </button>
                ) : (
                  <>
                    <strong>{label}:</strong> {message}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* User Plan Info Card */}
      <div
        className={`col-span-full rounded-2xl border p-5 shadow-sm transition-all
        ${
          userPlan === 'PRO'
            ? 'border-amber-200/80 bg-gradient-to-br from-white to-amber-50/30 dark:border-amber-800/50 dark:from-zinc-900/60 dark:to-amber-950/20'
            : userPlan === 'PLUS'
              ? 'border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/30 dark:border-indigo-800/50 dark:from-zinc-900/60 dark:to-indigo-950/20'
              : 'border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50/30 dark:border-zinc-800/50 dark:from-zinc-900/60 dark:to-zinc-900/40'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-sm
              ${
                userPlan === 'PRO'
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500'
                  : userPlan === 'PLUS'
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                    : 'bg-gradient-to-br from-zinc-400 to-zinc-500'
              }`}
            >
              {userPlan === 'PRO' ? (
                <Crown className="w-6 h-6 text-white" strokeWidth={2} />
              ) : userPlan === 'PLUS' ? (
                <Zap className="w-6 h-6 text-white" strokeWidth={2} />
              ) : (
                <User className="w-6 h-6 text-white" strokeWidth={2} />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {userPlan === 'PRO'
                  ? 'Plan PRO'
                  : userPlan === 'PLUS'
                    ? 'Plan PLUS'
                    : 'Plan FREE'}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white
                ${
                  userPlan === 'PRO'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : userPlan === 'PLUS'
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                      : 'bg-gradient-to-r from-zinc-500 to-zinc-600'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5" strokeWidth={2.5} />
                Aktywny
              </span>
            </div>

            <p className="mb-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {userPlan === 'PRO'
                ? 'To wydarzenie zostanie utworzone z planem PRO, obejmującym zaawansowaną analitykę, 3 podbicia i 3 powiadomienia push.'
                : userPlan === 'PLUS'
                  ? 'To wydarzenie zostanie utworzone z planem PLUS, obejmującym chat grupowy, 1 podbicie i 1 powiadomienie push.'
                  : 'To wydarzenie zostanie utworzone z planem FREE (do 10 uczestników, bez chatu grupowego).'}
            </p>

            <div
              className={`flex items-start gap-2 p-2.5 rounded-lg border
              ${
                userPlan === 'PRO'
                  ? 'bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-800/30'
                  : userPlan === 'PLUS'
                    ? 'bg-indigo-50/50 border-indigo-200/50 dark:bg-indigo-950/10 dark:border-indigo-800/30'
                    : 'bg-blue-50/50 border-blue-200/50 dark:bg-blue-950/10 dark:border-blue-800/30'
              }`}
            >
              <Info
                className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5
                ${
                  userPlan === 'PRO'
                    ? 'text-amber-600 dark:text-amber-400'
                    : userPlan === 'PLUS'
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-blue-600 dark:text-blue-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {userPlan === 'FREE'
                    ? 'Możesz ulepszyć plan wydarzenia w późniejszym etapie, aby uzyskać więcej funkcji i większą widoczność.'
                    : 'Plan wydarzenia dziedziczy Twój plan użytkownika. Możesz go dodatkowo ulepszyć po utworzeniu wydarzenia.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LEFT: Summary card */}
      <div className="p-5 bg-white border shadow-sm rounded-2xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/60">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold tracking-tight truncate">
                {values.title || 'Untitled'}
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-4">
          {/* Format i typ Section */}
          <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h4 className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
              <Users className="w-3.5 h-3.5" />
              Format i typ
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {modeChip}
              {meetingKindChip}
              {values.mode === 'GROUP' && (
                <Chip tone="zinc" icon={<Users className="h-3.5 w-3.5" />}>
                  {values.min}–{values.max} osób
                </Chip>
              )}
            </div>
          </div>

          {/* Dostęp i widoczność Section */}
          <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h4 className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
              <Eye className="w-3.5 h-3.5" />
              Dostęp i widoczność
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {visChip}
              {joinModeChip}
            </div>
          </div>

          {/* Ustawienia prywatności Section */}
          <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h4 className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
              <EyeOff className="w-3.5 h-3.5" />
              Ustawienia prywatności
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {addressVisChip}
              {membersVisChip}
            </div>
          </div>

          {/* Kategorie Section */}
          {selectedCategories.length > 0 && (
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <h4 className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
                <FolderIcon className="w-3.5 h-3.5" />
                Kategorie
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {selectedCategories.map((category) => (
                  <Chip
                    key={category.slug}
                    tone="zinc"
                    icon={<FolderIcon className="h-3.5 w-3.5" />}
                  >
                    {category.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Tagi Section */}
          {selectedTags.length > 0 && (
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <h4 className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
                <HashIcon className="w-3.5 h-3.5" />
                Tagi
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {selectedTags.map((tag) => (
                  <Chip
                    key={tag.slug}
                    tone="lime"
                    icon={<HashIcon className="h-3.5 w-3.5" />}
                  >
                    {tag.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Poziomy uczestników Section */}
          {levelChips && (
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <h4 className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
                <Gauge className="w-3.5 h-3.5" />
                Poziomy uczestników
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {levelChips}
              </div>
            </div>
          )}

          {/* Podstawowe informacje Section */}
          <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h4 className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
              <CalendarDays className="w-3.5 h-3.5" />
              Podstawowe informacje
            </h4>
            <div className="grid gap-3">
              <Kvp
                icon={<CalendarDays className="w-4 h-4" />}
                label="Data"
                value={dDate}
              />
              <Kvp
                icon={<Clock className="w-4 h-4" />}
                label="Godziny"
                value={
                  <span className="tabular-nums">
                    {startT} – {endT}
                  </span>
                }
              />

              {values.mode === 'GROUP' && (
                <Kvp
                  icon={<Users className="w-4 h-4" />}
                  label="Pojemność"
                  value={
                    <span className="tabular-nums">
                      {values.min} – {values.max}
                    </span>
                  }
                  mono
                />
              )}
            </div>
          </div>

          {/* Location Section */}
          <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h4 className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
              <MapPin className="w-3.5 h-3.5" />
              Lokalizacja i dostęp
            </h4>
            <div className="grid gap-3">
              <Kvp
                icon={<MapPin className="w-4 h-4" />}
                label="Miejsce"
                value={where}
              />
              <Kvp
                icon={<LinkIcon className="w-4 h-4" />}
                label="Link online"
                value={onlineUrl}
              />

              {!!values.location.radiusKm && values.location.radiusKm > 0 && (
                <Kvp
                  icon={<Ruler className="w-4 h-4" />}
                  label="Promień"
                  value={
                    <span className="tabular-nums">
                      {values.location.radiusKm} km
                    </span>
                  }
                  mono
                />
              )}
            </div>
          </div>

          {/* Join window settings */}
          {(values.joinOpensMinutesBeforeStart ||
            values.joinCutoffMinutesBeforeStart ||
            values.allowJoinLate ||
            values.lateJoinCutoffMinutesAfterStart) && (
            <div className="p-3 border border-indigo-200 rounded-xl bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-900/20">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-wide text-indigo-700 uppercase dark:text-indigo-300">
                <Gauge className="h-3.5 w-3.5" />
                Join Window Settings
              </div>
              <div className="space-y-1.5 text-sm text-indigo-900 dark:text-indigo-100">
                {values.joinOpensMinutesBeforeStart && (
                  <div className="flex items-start gap-2">
                    <Sprout className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Zapisy otwierają się{' '}
                      <strong className="font-semibold tabular-nums">
                        {values.joinOpensMinutesBeforeStart} min
                      </strong>{' '}
                      przed startem
                    </span>
                  </div>
                )}
                {values.joinCutoffMinutesBeforeStart && (
                  <div className="flex items-start gap-2">
                    <Rocket className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                    <span>
                      Zapisy zamykają się{' '}
                      <strong className="font-semibold tabular-nums">
                        {values.joinCutoffMinutesBeforeStart} min
                      </strong>{' '}
                      przed startem
                    </span>
                  </div>
                )}
                {values.allowJoinLate ? (
                  <div className="flex items-start gap-2">
                    <ClockFading className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>
                      Można dołączyć po starcie
                      {values.lateJoinCutoffMinutesAfterStart && (
                        <>
                          {' '}
                          (do{' '}
                          <strong className="font-semibold tabular-nums">
                            {values.lateJoinCutoffMinutesAfterStart} min
                          </strong>{' '}
                          po starcie)
                        </>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <ClockFading className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      Brak możliwości dołączenia po starcie
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Secondary explanations for visibilities */}
          <div className="grid gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <div>
              <span className="font-medium">Adres:</span>{' '}
              {resolvedAddressVis === AddressVisibility.Public
                ? 'dokładny adres będzie widoczny publicznie.'
                : resolvedAddressVis === AddressVisibility.AfterJoin
                  ? 'dokładny adres zobaczą tylko osoby, które dołączą.'
                  : 'dokładny adres nie będzie ujawniany — można pokazać przybliżenie z promieniem.'}
            </div>
            <div>
              <span className="font-medium">Lista uczestników:</span>{' '}
              {resolvedMembersVis === MembersVisibility.Public
                ? 'lista widoczna dla wszystkich.'
                : resolvedMembersVis === MembersVisibility.AfterJoin
                  ? 'lista widoczna dopiero po dołączeniu.'
                  : 'lista ukryta dla gości i uczestników (widoczna tylko dla organizatorów).'}
            </div>
          </div>

          {/* Join Form Questions */}
          {joinFormQuestions && joinFormQuestions.length > 0 && (
            <div className="p-4 border border-blue-200 rounded-xl bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-blue-700 dark:text-blue-300">
                <FileQuestion className="w-4 h-4" />
                Join Form Questions ({joinFormQuestions.length})
              </div>
              <div className="space-y-3">
                {joinFormQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-3 bg-white border border-blue-200 rounded-lg dark:border-blue-700 dark:bg-blue-950/30"
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {question.label}
                          </span>
                          {question.required && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            {question.type === 'TEXT' && '(Text)'}
                            {question.type === 'SINGLE_CHOICE' &&
                              '(Single Choice)'}
                            {question.type === 'MULTI_CHOICE' &&
                              '(Multiple Choice)'}
                          </span>
                        </div>
                        {question.helpText && (
                          <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                            {question.helpText}
                          </p>
                        )}
                        {question.options && question.options.length > 0 && (
                          <div className="mt-2 space-y-0.5">
                            {question.options.map((option, i) => (
                              <p
                                key={i}
                                className="text-xs text-blue-700 dark:text-blue-300"
                              >
                                • {option}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mini map (optional) */}
          {showMapPreview && hasCoords && center && (
            <div className="mt-1">
              <MapPreview
                center={{ lat: center.lat!, lng: center.lng! }}
                zoom={center ? 15 : 6}
                radiusMeters={radiusMeters ?? undefined}
                draggableMarker={false}
                clickToPlace={false}
                className="w-full border border-zinc-200 dark:border-zinc-800"
                mapId={mapId}
              />
            </div>
          )}

          {!!values.location.radiusKm && values.location.radiusKm > 0 && (
            <Kvp
              icon={<Ruler className="w-4 h-4" />}
              label="Radius"
              value={
                <span className="tabular-nums">
                  {values.location.radiusKm} km
                </span>
              }
              mono
            />
          )}

          {values.notes && values.notes.trim().length > 0 && (
            <div className="p-3 text-sm border border-dashed rounded-xl border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
              <span className="mr-2 font-medium">Logistics:</span>
              <span className="whitespace-pre-wrap">{values.notes}</span>
            </div>
          )}

          {values.description && values.description.trim().length > 0 && (
            <div className="p-3 mt-1 border rounded-xl border-zinc-200/70 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <NotebookText className="h-3.5 w-3.5" />
                Description
              </div>
              <div className="text-sm whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                {values.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSuggestion && (
        <div className="space-y-3">
          <SectionTitle>Instead of creating new, you could join…</SectionTitle>
          {/* tu możesz wstrzyknąć SuggestionCard-y */}
        </div>
      )}
    </div>
  );
}
