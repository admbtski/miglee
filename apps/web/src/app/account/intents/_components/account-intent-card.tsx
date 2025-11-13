'use client';

import { CapacityBadge } from '@/components/ui/capacity-badge';
import { CategoryPills, TagPills } from '@/components/ui/category-tag-pill';
import { LevelBadge, sortLevels } from '@/components/ui/level-badge';
import { Plan, planTheme } from '@/components/ui/plan-theme';
import { SimpleProgressBar } from '@/components/ui/simple-progress-bar';
import { StatusBadge, computeJoinState } from '@/components/ui/status-badge';
import { EventCountdownPill } from '@/features/intents/components/event-countdown-pill';
import type {
  AddressVisibility,
  Level,
} from '@/lib/api/__generated__/react-query-update';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import {
  Calendar,
  Eye,
  EyeOff,
  MapIcon,
  MapPin,
  MapPinHouseIcon,
  MapPinOffIcon,
  UserCheck,
  WifiIcon,
} from 'lucide-react';
import { ReactNode, useMemo } from 'react';
import { ActionMenu } from './action-menu';
import { formatDateRange } from './formatters';

/* ───────────────────────────── Utils ───────────────────────────── */

type AVNorm = 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN';

function normalizeAV(av?: AddressVisibility | null): AVNorm {
  if (!av) return 'HIDDEN';
  const s = String(av).toUpperCase();
  if (s.includes('PUBLIC')) return 'PUBLIC';
  if (s.includes('AFTER_JOIN') || s.includes('JOINED')) return 'AFTER_JOIN';
  return 'HIDDEN';
}

/* ────────────────────── Address visibility chip meta ────────────────────── */

type AvChipMeta = {
  label: string;
  Icon: React.ComponentType<any>;
  tone: string;
  ring: string;
  hint: string;
  visibility: AVNorm;
};

const CHIP_META: Record<AVNorm, AvChipMeta> = {
  PUBLIC: {
    label: 'Publiczne',
    Icon: Eye,
    tone: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-700/60',
    hint: 'Widoczne publicznie',
    visibility: 'PUBLIC',
  },
  AFTER_JOIN: {
    label: 'Tylko dla członków',
    Icon: UserCheck,
    tone: 'text-indigo-700 dark:text-indigo-300',
    ring: 'ring-indigo-200 dark:ring-indigo-700/60',
    hint: 'Widoczne po dołączeniu',
    visibility: 'AFTER_JOIN',
  },
  HIDDEN: {
    label: 'Ukryte',
    Icon: EyeOff,
    tone: 'text-neutral-600 dark:text-neutral-300',
    ring: 'ring-neutral-200 dark:ring-neutral-700/60',
    hint: 'Adres/Link ukryty',
    visibility: 'HIDDEN',
  },
} as const;

function addressVisibilityChipMeta(av?: AddressVisibility | null): AvChipMeta {
  return CHIP_META[normalizeAV(av)];
}

/* ───────────────────────────── Component ───────────────────────────── */

export function AccountIntentCard(props: {
  id?: string;
  description?: string | null;
  title?: string | null;
  startAt: string;
  endAt?: string | null;
  address?: string | null;
  onlineUrl?: string | null;
  joinedCount: number;
  min: number;
  max: number;
  categories?: string[];
  tags?: string[];
  levels?: Level[];
  isCanceled?: boolean | null;
  isFull?: boolean | null;
  isOngoing?: boolean | null;
  isDeleted?: boolean | null;
  hasStarted?: boolean | null;
  addressVisibility?: AddressVisibility | null;
  withinLock?: boolean | null;
  plan?: Plan;
  isHybrid: boolean;
  isOnline: boolean;
  isOnsite: boolean;

  // Join window settings
  joinOpensMinutesBeforeStart?: number | null;
  joinCutoffMinutesBeforeStart?: number | null;
  allowJoinLate?: boolean;
  lateJoinCutoffMinutesAfterStart?: number | null;
  joinManuallyClosed?: boolean;

  /** Czy to wydarzenie jest „moje” (owner); steruje menu akcji. */
  owned?: boolean;

  onPreview?: (id: string) => void | Promise<void>;
  onEdit?: (id: string) => void | Promise<void>;
  onCancel?: (id: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onLeave?: (id: string) => void | Promise<void>;
  onManage?: (id: string) => void | Promise<void>;
}) {
  const {
    id = '',
    title,
    description,
    startAt,
    endAt,
    address,
    onlineUrl,
    joinedCount,
    min,
    max,
    categories = [],
    tags = [],
    levels = [],
    isCanceled,
    isDeleted,
    isFull,
    isOngoing,
    addressVisibility,
    isHybrid,
    isOnline,
    isOnsite,
    hasStarted,
    withinLock,
    owned,
    plan,
    joinOpensMinutesBeforeStart,
    joinCutoffMinutesBeforeStart,
    allowJoinLate,
    lateJoinCutoffMinutesAfterStart,
    joinManuallyClosed,
    onPreview,
    onEdit,
    onCancel,
    onDelete,
    onLeave,
    onManage,
  } = props;

  const when = formatDateRange(startAt, endAt);

  const state = useMemo(
    () =>
      computeJoinState({
        startAt: new Date(startAt),
        isCanceled,
        isDeleted,
        isFull,
        isOngoing,
        hasStarted,
        withinLock,
      }),
    [hasStarted, isCanceled, isDeleted, isFull, isOngoing, startAt, withinLock]
  );

  const { status } = state as {
    status: { tone: any; reason: any; label: string };
  };
  const canJoin =
    (state as any)?.canJoin ??
    (!isCanceled && !isDeleted && !isFull && !withinLock); // fallback

  const fill = useMemo(
    () => Math.min(100, Math.round((joinedCount / Math.max(1, max)) * 100)),
    [joinedCount, max]
  );

  const sortedLevels = useMemo(() => sortLevels(levels), [levels]);

  const avChip = useMemo(
    () => addressVisibilityChipMeta(addressVisibility),
    [addressVisibility]
  );

  /** Czy wolno nam ujawnić realny adres/link? */

  /** Teksty pomocnicze do „ukryty/po dołączeniu”. */
  const hiddenLabel =
    avChip.visibility === 'AFTER_JOIN' ? 'po dołączeniu' : 'ukryty';

  /* ---------------------------- Location rendering --------------------------- */

  const LocationRows = () => {
    const rowBase =
      'flex items-center min-w-0 gap-1.5 text-xs text-neutral-600 dark:text-neutral-400';
    const rows: ReactNode[] = [];

    if (isHybrid) {
      if (address && onlineUrl) {
        rows.push(
          <p className={rowBase} key="onsite-address" title={address}>
            <MapPinHouseIcon className="w-3.5 h-3.5 shrink-0 align-middle" />
            <span className="truncate">Hybrydowe • {address}</span>
          </p>
        );
      } else {
        rows.push(
          <p className={rowBase} key="onsite-hidden" title={avChip.hint}>
            <MapPinHouseIcon className="w-3.5 h-3.5 shrink-0 align-middle" />
            <span className="truncate">Hybrydowe • {hiddenLabel}</span>
          </p>
        );
      }
    }

    // ONSITE (adres)
    if (isOnsite) {
      if (address) {
        rows.push(
          <p className={rowBase} key="onsite-address" title={address}>
            <MapPin className="w-3.5 h-3.5 shrink-0 align-middle" />
            <span className="truncate">{address}</span>
          </p>
        );
      } else {
        rows.push(
          <p className={rowBase} key="onsite-hidden" title={avChip.hint}>
            <MapIcon className="w-3.5 h-3.5 shrink-0 align-middle" />
            <span className="truncate">Adres ${hiddenLabel}</span>
          </p>
        );
      }
    }

    // ONLINE (link)
    if (isOnline) {
      if (onlineUrl) {
        rows.push(
          <p className={rowBase} key="online-link" title={onlineUrl}>
            <WifiIcon className="w-3.5 h-3.5 shrink-0 align-middle" />
            <span className="truncate">Link do spotkania</span>
          </p>
        );
      } else {
        rows.push(
          <p className={rowBase} key="online-hidden" title={avChip.hint}>
            <WifiIcon className="w-3.5 h-3.5 shrink-0 align-middle" />
            <span className="truncate">Link {hiddenLabel}</span>
          </p>
        );
      }
    }

    // Brak danych/konflikt flag → neutralny fallback
    if (rows.length === 0) {
      rows.push(
        <p className={rowBase} key="no-location" title="Brak danych o miejscu">
          <MapPinOffIcon className="w-3.5 h-3.5 shrink-0 align-middle" />
          <span className="truncate">Brak danych o miejscu</span>
        </p>
      );
    }

    return <div className="mt-1 flex flex-col gap-1">{rows}</div>;
  };

  const planStyling = useMemo(() => planTheme(plan), [plan, canJoin]);

  return (
    <motion.div
      layout="size"
      whileHover={{ y: canJoin ? -2 : 0, scale: canJoin ? 1.01 : 1 }}
      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
      className={clsx(
        'relative w-full rounded-2xl p-4 flex flex-col gap-2 shadow-sm ring-1',
        planStyling.ring,
        planStyling.bg,
        planStyling?.ringExtra,
        planStyling?.glow,
        'cursor-pointer select-none'
      )}
      role="button"
      tabIndex={0}
      aria-label={`Szczegóły wydarzenia: ${title}`}
      data-plan={plan}
    >
      {/* Top: range + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
              {when}
            </span>
          </div>
        </div>

        <ActionMenu
          label="Menu akcji intentu"
          onPreview={() => onPreview?.(id)}
          onEdit={() => onEdit?.(id)}
          onCancel={() => onCancel?.(id)}
          onDelete={() => onDelete?.(id)}
          onLeave={() => onLeave?.(id)}
          onManage={() => onManage?.(id)}
          disableDelete={!owned}
          disableCancel={!owned}
          disableEdit={!owned}
          disableLeave={owned}
          disableManage={!owned}
        />
      </div>

      {/* Title + description */}
      <button
        type="button"
        onClick={() => onPreview?.(id)}
        className="group text-left"
        aria-label="Podgląd wydarzenia"
        title={title ?? ''}
      >
        <p className="line-clamp-2 text-sm font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
          {title || '—'}
        </p>
        {description && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-800 dark:text-zinc-200">
            {description}
          </p>
        )}
      </button>

      {/* Lokalizacja/Link + chip widoczności */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <LocationRows />
        </div>

        <div
          className={clsx(
            'inline-flex shrink-0 items-center gap-1.5 truncate text-nowrap rounded-full px-1.5 py-0.5 text-[11px] ring-1',
            avChip.tone,
            avChip.ring,
            'bg-white/80 dark:bg-neutral-900/60'
          )}
          title={avChip.hint}
        >
          <avChip.Icon className="w-3.5 h-3.5 shrink-0 align-middle" />
          <span className="truncate font-medium">{avChip.label}</span>
        </div>
      </div>

      {/* Capacity + Status */}
      <div className="mt-1 flex items-center justify-between">
        <CapacityBadge
          joinedCount={joinedCount}
          size="sm"
          min={min}
          max={max}
          isFull={!!isFull}
          canJoin={!!canJoin}
          statusReason={status.reason}
        />
        <StatusBadge
          size="sm"
          tone={status.tone}
          reason={status.reason}
          label={status.label}
        />
      </div>

      {/* Countdown Timer Pill */}
      <EventCountdownPill
        startAt={new Date(startAt)}
        endAt={new Date(endAt ?? startAt)}
        joinOpensMinutesBeforeStart={joinOpensMinutesBeforeStart}
        joinCutoffMinutesBeforeStart={joinCutoffMinutesBeforeStart}
        allowJoinLate={allowJoinLate}
        lateJoinCutoffMinutesAfterStart={lateJoinCutoffMinutesAfterStart}
        joinManuallyClosed={joinManuallyClosed}
        isCanceled={!!isCanceled}
        isDeleted={!!isDeleted}
      />

      {/* Progress */}
      <div className="mt-1">
        <SimpleProgressBar value={fill} active={!!canJoin} />
      </div>

      {/* Pills + levels */}
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {sortedLevels.length > 0 && (
          <div className="flex min-w-0 items-center gap-1.5">
            {sortedLevels.map((lv) => (
              <LevelBadge key={lv} level={lv} size="sm" variant="iconText" />
            ))}
          </div>
        )}
        <CategoryPills categories={categories} size="sm" />
        <TagPills tags={tags} size="sm" />
      </div>
    </motion.div>
  );
}
