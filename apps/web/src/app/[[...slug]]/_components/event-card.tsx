// EventCard.tsx
'use client';

import { CapacityBadge } from '@/components/ui/capacity-badge';
import { CategoryPills, TagPills } from '@/components/ui/category-tag-pill';
import { LevelBadge, sortLevels } from '@/components/ui/level-badge';
import { PlanBadge } from '@/components/ui/plan-badge';
import { Plan, planTheme } from '@/components/ui/plan-theme';
import { SimpleProgressBar } from '@/components/ui/simple-progress-bar';
import { computeJoinState, StatusBadge } from '@/components/ui/status-badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { EventDetailsModal } from '@/features/intents/components/event-details-modal';
import {
  AddressVisibility,
  IntentMember,
  Level,
  MembersVisibility,
} from '@/lib/api/__generated__/react-query-update';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Map as MapIcon,
  MapPin,
  MapPinHouseIcon,
  UserCheck,
  Wifi as WifiIcon,
} from 'lucide-react';
import { KeyboardEvent, useCallback, useMemo, useState } from 'react';

/* ───────────────────────────── Types ───────────────────────────── */

export interface EventCardProps {
  intentId?: string;
  lat?: number | null;
  lng?: number | null;
  startISO: string;
  endISO: string;
  avatarUrl: string;
  organizerName: string;
  title: string;
  description: string;
  address?: string;
  onlineUrl?: string;
  joinedCount: number;
  min: number;
  max: number;
  tags?: string[];
  categories: string[];
  lockHoursBeforeStart?: number;
  inline?: boolean;
  onJoin?: () => void | Promise<void>;
  className?: string;
  verifiedAt?: string;

  isOngoing: boolean;
  isCanceled: boolean;
  isDeleted: boolean;
  hasStarted: boolean;
  withinLock: boolean;
  canJoin: boolean;
  isFull: boolean;

  isHybrid: boolean;
  isOnline: boolean;
  isOnsite: boolean;

  levels: Level[];
  addressVisibility: AddressVisibility;
  membersVisibility: MembersVisibility;
  members?: IntentMember[];
  plan?: Plan;
  showSponsoredBadge?: boolean;
  onHover?: (
    intentId: string | null,
    lat?: number | null,
    lng?: number | null
  ) => void;
}

/* ───────────────────────────── Utils ───────────────────────────── */

const MONTHS_PL_SHORT = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'gru',
] as const;

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));
const isValidDate = (d: Date) =>
  d instanceof Date && !Number.isNaN(d.getTime());
const parseISO = (iso: string, fallback: Date = new Date()) => {
  const d = new Date(iso);
  return isValidDate(d) ? d : fallback;
};

function formatDateRange(start: Date, end: Date) {
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const fmt = (d: Date) =>
    `${pad2(d.getDate())} ${MONTHS_PL_SHORT[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  return sameDay
    ? `${fmt(start)} – ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
    : `${fmt(start)} – ${fmt(end)}`;
}

const plural = (n: number, forms: [string, string, string]) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14))
    return forms[1];
  return forms[2];
};

function humanDuration(start: Date, end: Date) {
  const ms = Math.max(0, end.getTime() - start.getTime());
  const total = Math.round(ms / 60000);
  const days = Math.floor(total / (60 * 24));
  const hours = Math.floor((total - days * 24 * 60) / 60);
  const mins = total % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${plural(days, ['dzień', 'dni', 'dni'])}`);
  if (hours > 0) parts.push(`${hours} h`);
  if (mins > 0 && days === 0)
    parts.push(`${mins} ${plural(mins, ['minuta', 'minuty', 'minut'])}`);
  return parts.length ? parts.join(' ') : '< 1 min';
}

/* ───────────────────────────── Atomy ───────────────────────────── */

function Avatar({ url, alt }: { url: string; alt: string }) {
  return (
    <img
      src={url}
      alt={alt}
      className="object-cover w-12 h-12 border rounded-full border-neutral-200 dark:border-neutral-700"
      loading="lazy"
      decoding="async"
    />
  );
}

function normalizeAV(
  av: AddressVisibility
): 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN' {
  const s = String(av).toUpperCase();
  if (s.includes('PUBLIC')) return 'PUBLIC';
  if (s.includes('AFTER_JOIN')) return 'AFTER_JOIN';
  return 'HIDDEN';
}

function addressVisibilityMeta(av: AddressVisibility) {
  const v = normalizeAV(av);
  switch (v) {
    case 'PUBLIC':
      return {
        label: 'Adres publiczny',
        Icon: Eye,
        tone: 'text-emerald-700 dark:text-emerald-300',
        ring: 'ring-emerald-200 dark:ring-emerald-700/60',
        canShow: true,
        hint: 'Dokładny adres widoczny publicznie',
      };
    case 'AFTER_JOIN':
      return {
        label: 'Adres po dołączeniu',
        Icon: UserCheck,
        tone: 'text-indigo-700 dark:text-indigo-300',
        ring: 'ring-indigo-200 dark:ring-indigo-700/60',
        canShow: false,
        hint: 'Dokładny adres dostępny po dołączeniu',
      };
    case 'HIDDEN':
    default:
      return {
        label: 'Adres ukryty',
        Icon: EyeOff,
        tone: 'text-neutral-600 dark:text-neutral-300',
        ring: 'ring-neutral-200 dark:ring-neutral-700',
        canShow: false,
        hint: 'Dokładny adres nie jest ujawniany',
      };
  }
}

/* ─────────────────────────── Component ─────────────────────────── */

export function EventCard({
  intentId,
  lat,
  lng,
  startISO,
  endISO,
  avatarUrl,
  organizerName,
  title,
  description,
  address,
  onlineUrl,
  joinedCount,
  min,
  max,
  tags = [],
  categories = [],
  inline = false,
  onJoin,
  className,
  verifiedAt,
  hasStarted,
  isFull,
  isOngoing,
  isCanceled,
  isDeleted,
  canJoin,
  withinLock,
  members = [],
  plan = 'default',
  addressVisibility,
  levels,
  membersVisibility, // info: przekazywane do modala
  showSponsoredBadge = true,
  isHybrid,
  isOnline,
  isOnsite,
  onHover,
}: EventCardProps) {
  const [open, setOpen] = useState(false);

  const start = useMemo(() => parseISO(startISO), [startISO]);
  const end = useMemo(() => parseISO(endISO, start), [endISO, start]);

  const { status } = useMemo(
    () =>
      computeJoinState({
        startAt: start,
        isCanceled,
        isDeleted,
        isFull,
        isOngoing,
        hasStarted,
        withinLock,
      }),
    [start, hasStarted, isCanceled, isDeleted, isFull, isOngoing, withinLock]
  );

  const fill = useMemo(
    () => Math.min(100, Math.round((joinedCount / Math.max(1, max)) * 100)),
    [joinedCount, max]
  );

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (intentId && onHover) {
      onHover(intentId, lat, lng);
    }
  }, [intentId, lat, lng, onHover]);

  const handleMouseLeave = useCallback(() => {
    if (onHover) {
      onHover(null);
    }
  }, [onHover]);

  // ✅ przekazujemy canJoin do planRingBg
  const planStyling = useMemo(() => planTheme(plan), [plan, canJoin]);
  const avMeta = useMemo(
    () => addressVisibilityMeta(addressVisibility),
    [addressVisibility]
  );

  const sortedLevels = useMemo(() => sortLevels(levels), [levels]);

  const details = (
    <EventDetailsModal
      open={open}
      onClose={closeModal}
      onJoin={onJoin}
      data={{
        eventId: intentId,
        title,
        startISO,
        endISO,
        description,
        address,
        onlineUrl,
        categories,
        tags,
        levels,
        min,
        max,
        joinedCount,
        organizerName,
        avatarUrl,
        verifiedAt,
        status,
        canJoin,
        members,
        membersVisibility,
        addressVisibility,
        plan,
        showSponsoredBadge,
        lockHoursBeforeStart: 6,
      }}
    />
  );

  const renderLocationRow = () => {
    const base =
      'flex items-center min-w-0 gap-1.5 mt-1 text-xs text-neutral-600 dark:text-neutral-400';

    if (isOnsite && !isOnline) {
      return avMeta.canShow ? (
        <p className={base}>
          <MapPin className="w-3.5 h-3.5 shrink-0 align-middle" />
          <span className="truncate" title={address}>
            {address}
          </span>
        </p>
      ) : (
        <p className={base}>
          <MapIcon className="w-3.5 h-3.5 shrink-0 align-middle" />
          <span className="truncate" title={avMeta.hint}>
            {avMeta.label}
          </span>
        </p>
      );
    }

    if (isOnline && !isOnsite) {
      return (
        <p className={base}>
          <WifiIcon className="w-3.5 h-3.5 shrink-0 align-middle" />
          <span className="truncate" title="Online">
            Online
          </span>
        </p>
      );
    }

    if (isHybrid || (address && onlineUrl)) {
      return avMeta.canShow ? (
        <p className={base}>
          <MapPinHouseIcon className="w-3.5 h-3.5 shrink-0 align-middle" />
          <span className="truncate" title="Hybrid">
            {address} • Hybrid
          </span>
        </p>
      ) : (
        <p className={base}>
          <MapIcon className="w-3.5 h-3.5 shrink-0 align-middle" />
          <span className="truncate" title={avMeta.hint}>
            Hybrid • {avMeta.label}
          </span>
        </p>
      );
    }

    return null;
  };

  /* ───────── Inline wariant ───────── */
  if (inline) {
    return (
      <>
        <div
          className={clsx(
            'relative flex items-center gap-4 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 text-sm cursor-pointer select-none',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 rounded-lg',
            className
          )}
          role="button"
          tabIndex={0}
          onClick={openModal}
          onKeyDown={handleKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-label={`Szczegóły wydarzenia: ${organizerName}`}
          data-plan={plan}
        >
          <Avatar url={avatarUrl} alt={`Organizator: ${organizerName}`} />
          <div className="flex-1 min-w-0">
            <p
              className="font-medium truncate text-neutral-900 dark:text-neutral-100"
              title={organizerName}
            >
              <span className="inline-flex items-center gap-1.5 max-w-full">
                <span className="truncate">{organizerName}</span>
                <VerifiedBadge verifiedAt={verifiedAt} />
              </span>
            </p>
            <p className="text-xs truncate text-neutral-600 dark:text-neutral-400">
              {title}
            </p>

            {/* zakres + lokalizacja */}
            <p className="text-xs truncate text-neutral-600 dark:text-neutral-400">
              {formatDateRange(start, end)} • {humanDuration(start, end)}
            </p>
            {renderLocationRow()}
          </div>

          <div className="flex items-center gap-3 min-w-0">
            {showSponsoredBadge && plan && plan !== 'default' && (
              <PlanBadge plan={plan} size="xs" variant="icon" />
            )}
            {status.reason !== 'FULL' && (
              <StatusBadge
                tone={status.tone}
                reason={status.reason}
                label={status.label}
              />
            )}
            <CapacityBadge
              joinedCount={joinedCount}
              min={min}
              max={max}
              isFull={isFull}
              canJoin={canJoin}
              statusReason={status.reason}
            />
          </div>
        </div>
        {details}
      </>
    );
  }

  /* ───────── Tile wariant ───────── */
  return (
    <>
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
          'cursor-pointer select-none',
          className
        )}
        role="button"
        tabIndex={0}
        onClick={openModal}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={`Szczegóły wydarzenia: ${organizerName}`}
        data-plan={plan}
      >
        {/* Range + duration */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center min-w-0 gap-1.5 overflow-hidden text-sm text-neutral-600 dark:text-neutral-400">
            <Calendar className="w-4 h-4 shrink-0 align-middle" />
            <span className="font-medium truncate text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
              {formatDateRange(start, end)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
            <Clock className="w-4 h-4 shrink-0 align-middle" />
            <span>{humanDuration(start, end)}</span>
          </div>
        </div>

        {/* Organizer & description + location */}
        <div className="flex items-start min-w-0 gap-3 mt-1">
          <Avatar url={avatarUrl} alt="Organizer" />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100"
              title={organizerName}
            >
              <span className="inline-flex items-center max-w-full gap-1.5">
                <VerifiedBadge
                  size="sm"
                  variant="icon"
                  verifiedAt={verifiedAt}
                />
                <span className="truncate">{organizerName}</span>
              </span>
            </p>

            <p
              className="text-xs leading-5 text-neutral-800 dark:text-neutral-200 line-clamp-2"
              title={description}
            >
              {description}
            </p>

            <div className="flex flex-row flex-nowrap gap-2">
              {renderLocationRow()}

              {!avMeta.canShow && (
                <div
                  className={clsx(
                    'mt-1 inline-flex truncate text-nowrap items-center gap-1.5 rounded-full px-1 py-0.5 text-[11px] ring-1',
                    avMeta.tone,
                    avMeta.ring,
                    'bg-white/80 dark:bg-neutral-900/60'
                  )}
                  title={avMeta.hint}
                >
                  <avMeta.Icon className="w-3.5 h-3.5 shrink-0 align-middle" />
                  <span className="font-medium truncate">{avMeta.label}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Capacity + status */}
        <div className="flex items-center justify-between gap-3">
          <CapacityBadge
            joinedCount={joinedCount}
            size="sm"
            min={min}
            max={max}
            isFull={isFull}
            canJoin={canJoin}
            statusReason={status.reason}
          />
          <div className="flex items-center gap-1.5 min-w-0">
            {showSponsoredBadge && plan && plan !== 'default' && (
              <PlanBadge plan={plan} size="xs" variant="icon" />
            )}
            {status.reason !== 'FULL' && (
              <StatusBadge
                size="xs"
                tone={status.tone}
                reason={status.reason}
                label={status.label}
              />
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-1.5">
          <SimpleProgressBar value={fill} active />
        </div>

        {/* Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {sortedLevels.length > 0 && (
            <div className="flex flex-nowrap items-center gap-1.5 min-w-0">
              {sortedLevels.map((lv) => (
                <LevelBadge key={lv} level={lv} size="sm" variant="iconText" />
              ))}
            </div>
          )}

          <CategoryPills categories={categories} size="sm" />
          <TagPills tags={tags} size="sm" />
        </div>
      </motion.div>

      {/* Modal */}
      {details}
    </>
  );
}
