// EventCard.tsx
'use client';

import { CategoryPills, TagPills } from '@/components/ui/category-tag-pill';
import { SimpleProgressBar } from '@/components/ui/simple-progress-bar';
import { computeJoinState, StatusBadge } from '@/components/ui/status-badge';
import type { JoinTone, JoinReason } from '@/components/ui/status-badge';
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
  BadgeCheck,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Gauge,
  Map as MapIcon,
  MapPin,
  MapPinHouseIcon,
  Rocket,
  Sprout,
  StarIcon,
  StarsIcon,
  UserCheck,
  Users,
  Wifi as WifiIcon,
} from 'lucide-react';
import React, { KeyboardEvent, useCallback, useMemo, useState } from 'react';

/* ───────────────────────────── Types ───────────────────────────── */

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type Plan = 'default' | 'basic' | 'plus' | 'premium';

export interface EventCardProps {
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
  lockHoursBeforeStart?: number; // rezerwacja pod przyszłe reguły
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
  membersVisibility: MembersVisibility; // (na razie nieużywane)
  members?: IntentMember[];
  plan?: Plan;
  showSponsoredBadge?: boolean;
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

function formatVerifiedTitle(verifiedAt?: string) {
  if (!verifiedAt) return null;
  const d = parseISO(verifiedAt);
  if (!isValidDate(d)) return 'Zweryfikowany organizator';
  const day = pad2(d.getDate());
  const mon = MONTHS_PL_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `Zweryfikowany organizator (od ${day} ${mon} ${year})`;
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

function VerifiedBadge({ verifiedAt }: { verifiedAt?: string }) {
  if (!verifiedAt) return null;
  const title = formatVerifiedTitle(verifiedAt) ?? 'Zweryfikowany organizator';
  return (
    <BadgeCheck
      className="w-3.5 h-3.5 shrink-0 text-sky-500 dark:text-sky-400"
      aria-label={title ?? undefined}
      role="img"
    />
  );
}

/* ─────────────── Mapowania: Levels & AddressVisibility ─────────────── */

const LEVEL_META: Record<
  Level,
  { label: string; Icon: IconType; tone: string; ring: string }
> = {
  [Level.Beginner]: {
    label: 'Beginner',
    Icon: Sprout,
    tone: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-700/60',
  },
  [Level.Intermediate]: {
    label: 'Intermediate',
    Icon: Gauge,
    tone: 'text-indigo-700 dark:text-indigo-300',
    ring: 'ring-indigo-200 dark:ring-indigo-700/60',
  },
  [Level.Advanced]: {
    label: 'Advanced',
    Icon: Rocket,
    tone: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-200 dark:ring-amber-700/60',
  },
};

/** Stabilna kolejność prezentacji leveli. */
const LEVEL_ORDER: Record<Level, number> = {
  [Level.Beginner]: 0,
  [Level.Intermediate]: 1,
  [Level.Advanced]: 2,
};

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

/* ─────────────── Capacity Badge (spójny z computeJoinState) ─────────────── */

function CapacityBadge({
  joinedCount,
  min,
  max,
  isFull,
  canJoin,
  statusReason,
}: {
  joinedCount: number;
  min: number;
  max: number;
  isFull: boolean;
  canJoin: boolean;
  statusReason: JoinReason;
}) {
  const spotsLeft = Math.max(0, max - joinedCount);
  const fillPct = Math.min(
    100,
    Math.round((joinedCount / Math.max(1, max)) * 100)
  );

  const toneClass =
    isFull || statusReason === 'FULL'
      ? 'text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-800/50'
      : canJoin
        ? fillPct >= 80
          ? 'text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-800/50'
          : 'text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800/50'
        : 'text-neutral-700 dark:text-neutral-300 ring-neutral-200 dark:ring-neutral-700';

  const label =
    isFull || statusReason === 'FULL'
      ? `Brak miejsc • ${joinedCount} / ${min}-${max}`
      : canJoin
        ? `${joinedCount} / ${max} • ${spotsLeft} ${plural(spotsLeft, ['wolne', 'wolne', 'wolnych'])}`
        : `${joinedCount} / ${max}`;

  const aria =
    isFull || statusReason === 'FULL'
      ? `Brak miejsc. Zajętość ${joinedCount} w zakresie ${min}-${max}.`
      : `Zajętość ${joinedCount} z ${max}. ${spotsLeft} ${plural(spotsLeft, ['miejsce', 'miejsca', 'miejsc'])} wolne.`;

  return (
    <span
      className={clsx(
        'inline-flex truncate items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 bg-white/80 dark:bg-neutral-900/60',
        toneClass
      )}
      aria-label={aria}
      title={aria}
    >
      <Users className="w-3.5 h-3.5" aria-hidden />
      <span className="font-medium truncate">{label}</span>
    </span>
  );
}

/* ─────────────── WARIANTY PLANU ─────────────── */

export function planRingBg(plan: Plan | undefined, canJoin: boolean) {
  switch (plan ?? 'default') {
    case 'basic':
      return {
        ring: 'ring-emerald-300/60 dark:ring-emerald-700/50',
        bg: canJoin
          ? 'bg-emerald-50/40 dark:bg-emerald-900/10'
          : 'bg-neutral-50 dark:bg-neutral-950',
        label: <StarsIcon className="w-3.5 h-3.5 text-emerald-50" />,
        labelClass: 'bg-emerald-600 text-white dark:bg-emerald-500',
      };
    case 'plus':
      return {
        ring: 'ring-indigo-300/60 dark:ring-indigo-700/50',
        bg: canJoin
          ? 'bg-indigo-50/40 dark:bg-indigo-900/10'
          : 'bg-neutral-50 dark:bg-neutral-950',
        label: <StarIcon className="w-3.5 h-3.5 text-indigo-50" />,
        labelClass: 'bg-indigo-600 text-white dark:bg-indigo-500',
      };
    case 'premium':
      return {
        ring: 'ring-amber-400/70 dark:ring-amber-700/60',
        bg: canJoin
          ? 'bg-amber-50/45 dark:bg-amber-900/10'
          : 'bg-neutral-50 dark:bg-neutral-950',
        label: <StarIcon className="w-3.5 h-3.5 text-amber-50" />,
        labelClass: 'bg-amber-600 text-white dark:bg-amber-500',
      };
    default:
      return {
        ring: 'ring-neutral-200/70 dark:ring-neutral-800',
        bg: canJoin
          ? 'bg-white dark:bg-neutral-900'
          : 'bg-neutral-50 dark:bg-neutral-950',
        label: undefined,
        labelClass: '',
      };
  }
}

export function PlanBadge({
  label,
  className,
  title,
}: {
  label?: React.ReactNode;
  className: string;
  title?: string;
}) {
  if (!label) return null;
  return (
    <div
      className={clsx(
        'pointer-events-none shrink-0 flex justify-center items-center select-none rounded-full px-1.5 py-0.5 h-min shadow-sm text-xs',
        className
      )}
      title={title}
      aria-hidden
    >
      {label}
    </div>
  );
}

/* ─────────────────────────── Component ─────────────────────────── */

export function EventCard({
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
  membersVisibility, // eslint-disable-line @typescript-eslint/no-unused-vars
  showSponsoredBadge = true,
  isHybrid,
  isOnline,
  isOnsite,
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

  const planStyling = useMemo(
    () => planRingBg(plan, !!canJoin),
    [plan, canJoin]
  );
  const avMeta = useMemo(
    () => addressVisibilityMeta(addressVisibility),
    [addressVisibility]
  );

  const sortedLevels = useMemo(
    () =>
      (levels ?? []).slice().sort((a, b) => LEVEL_ORDER[a] - LEVEL_ORDER[b]),
    [levels]
  );

  const details = (
    <EventDetailsModal
      open={open}
      onClose={closeModal}
      onJoin={onJoin}
      data={{
        startISO,
        endISO,
        description,
        address,
        onlineUrl,
        categories,
        tags,
        min,
        max,
        joinedCount,
        organizerName,
        avatarUrl,
        verifiedAt,
        status,
        canJoin,
        members,
        plan,
      }}
    />
  );

  /* ───────── helper widoku lokalizacji (wg addressVisibility) ───────── */
  const renderLocationRow = () => {
    if (isOnsite && !isOnline) {
      return avMeta.canShow ? (
        <p className="flex items-center min-w-0 gap-1 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate" title={address}>
            {address}
          </span>
        </p>
      ) : (
        <p className="flex items-center min-w-0 gap-1 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          <MapIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate" title={avMeta.hint}>
            {avMeta.label}
          </span>
        </p>
      );
    }

    if (isOnline && !isOnsite) {
      return (
        <p className="flex items-center min-w-0 gap-1 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          <WifiIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate" title="Online">
            Online
          </span>
        </p>
      );
    }

    if (isHybrid || (address && onlineUrl)) {
      return avMeta.canShow ? (
        <p className="flex items-center min-w-0 gap-1 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          <MapPinHouseIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate" title="Hybrid">
            {address}, Hybrid
          </span>
        </p>
      ) : (
        <p className="flex items-center min-w-0 gap-1 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          <MapIcon className="w-3.5 h-3.5 shrink-0" />
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
            {showSponsoredBadge && planStyling.label && (
              <PlanBadge
                label={planStyling.label}
                className={planStyling.labelClass}
                title={
                  plan === 'basic'
                    ? 'Basic'
                    : plan === 'plus'
                      ? 'Plus'
                      : plan === 'premium'
                        ? 'Premium'
                        : undefined
                }
              />
            )}
            <StatusBadge
              tone={status.tone}
              reason={status.reason}
              label={status.label}
            />
            <CapacityBadge
              joinedCount={joinedCount}
              min={min}
              max={max}
              isFull={isFull}
              canJoin={canJoin}
              statusTone={status.tone}
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
          'cursor-pointer select-none',
          className
        )}
        role="button"
        tabIndex={0}
        onClick={openModal}
        onKeyDown={handleKeyDown}
        aria-label={`Szczegóły wydarzenia: ${organizerName}`}
        data-plan={plan}
      >
        {/* Range + duration */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center min-w-0 gap-1 overflow-hidden text-sm text-neutral-600 dark:text-neutral-400">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="font-medium truncate text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
              {formatDateRange(start, end)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
            <Clock className="w-4 h-4 shrink-0" />
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
              <span className="inline-flex items-center max-w-full gap-1">
                <VerifiedBadge verifiedAt={verifiedAt} />
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
              {/* Lokalizacja zgodnie z addressVisibility */}
              {renderLocationRow()}

              {/* Badge widoczności adresu — TYLKO gdy adres nie jest publiczny */}
              {!avMeta.canShow && (
                <div
                  className={clsx(
                    'mt-1 inline-flex truncate text-nowrap items-center gap-1 rounded-full px-1 py-0.5 text-[11px] ring-1',
                    avMeta.tone,
                    avMeta.ring,
                    'bg-white/80 dark:bg-neutral-900/60'
                  )}
                  title={avMeta.hint}
                >
                  <avMeta.Icon className="w-3.5 h-3.5 shrink-0" />
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
            min={min}
            max={max}
            isFull={isFull}
            canJoin={canJoin}
            statusTone={status.tone}
            statusReason={status.reason}
          />
          <div className="flex items-center gap-1 min-w-0">
            {showSponsoredBadge && planStyling.label && (
              <PlanBadge
                label={planStyling.label}
                className={clsx(planStyling.labelClass, 'shadow-md/30')}
                title={
                  plan === 'basic'
                    ? 'Basic'
                    : plan === 'plus'
                      ? 'Plus'
                      : plan === 'premium'
                        ? 'Premium'
                        : undefined
                }
              />
            )}
            <StatusBadge
              tone={status.tone}
              reason={status.reason}
              label={status.label}
            />
          </div>
        </div>

        <SimpleProgressBar value={fill} active={canJoin} />

        {/* Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {/* Levels pills (jeśli są) */}
          {sortedLevels.length > 0 && (
            <div className="flex flex-nowrap items-center gap-1.5 min-w-0">
              {sortedLevels.map((lv) => {
                const meta = LEVEL_META[lv];
                if (!meta) return null;
                const { Icon, label, tone, ring } = meta;
                return (
                  <span
                    key={lv}
                    className={clsx(
                      'inline-flex items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] ring-1 bg-white/80 dark:bg-neutral-900/60',
                      tone,
                      ring
                    )}
                    title={`Poziom: ${label}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="font-medium truncate">{label}</span>
                  </span>
                );
              })}
            </div>
          )}

          <CategoryPills categories={categories} />
          <TagPills tags={tags} />
        </div>
      </motion.div>

      {/* Modal */}
      {details}
    </>
  );
}
