'use client';

import { SimpleProgressBar } from '@/components/ui/simple-progress-bar';
import { IntentMember } from '@/lib/api/__generated__/react-query-update';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  Calendar,
  Clock,
  Lock,
  MapPin,
  MapPinHouseIcon,
  StarIcon,
  StarsIcon,
  Users,
  WifiIcon,
} from 'lucide-react';
import { KeyboardEvent, useCallback, useMemo, useState } from 'react';
import { EventDetailsModal } from '@/features/intents/components/event-details-modal';
import { CategoryPills, TagPills } from '@/components/ui/category-tag-pill';
import clsx from 'clsx';
import { computeJoinState, StatusBadge } from '@/components/ui/status-badge';

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
  'lis',
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

const capacityLabel = (joinedCount: number, min: number, max: number) =>
  `${joinedCount} / ${min}-${max} osób`;

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
      aria-label={title}
    />
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
    >
      {label}
    </div>
  );
}

/* ─────────────────────────── Komponent ─────────────────────────── */

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
  showSponsoredBadge = true,
}: EventCardProps) {
  const [open, setOpen] = useState(false);

  const start = useMemo(() => parseISO(startISO), [startISO]);
  const end = useMemo(() => parseISO(endISO, start), [endISO, start]);

  const { status } = useMemo(
    () =>
      computeJoinState({
        startAt: new Date(startISO),
        isCanceled,
        isDeleted,
        isFull,
        isOngoing,
        hasStarted,
        withinLock,
      }),
    [hasStarted, isCanceled, isDeleted, isFull, isOngoing, startISO, withinLock]
  );

  const fill = Math.min(
    100,
    Math.round((joinedCount / Math.max(1, max)) * 100)
  );

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const onKeyPress = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  }, []);

  const planStyling = planRingBg(plan, !!canJoin);

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
          onKeyDown={onKeyPress}
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
                <VerifiedBadge verifiedAt={verifiedAt!} />
              </span>
            </p>
            <p className="text-xs truncate text-neutral-600 dark:text-neutral-400">
              {title}
            </p>
            <p className="text-xs truncate text-neutral-600 dark:text-neutral-400">
              {formatDateRange(start, end)} • {humanDuration(start, end)}
              {address ? ` • ${address}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            {showSponsoredBadge && (
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
            <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
              {capacityLabel(joinedCount, min, max)}
            </span>
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
        onKeyDown={onKeyPress}
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
                <VerifiedBadge verifiedAt={verifiedAt!} />
                <span className="truncate">{organizerName}</span>
              </span>
            </p>

            <p
              className="text-xs leading-5 text-neutral-800 dark:text-neutral-200 line-clamp-2"
              title={description}
            >
              {description}
            </p>

            {address && !onlineUrl && (
              <p className="flex items-center min-w-0 gap-1 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate" title={address}>
                  {address}
                </span>
              </p>
            )}

            {!address && onlineUrl && (
              <p className="flex items-center min-w-0 gap-1 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                <WifiIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate" title="Online">
                  Online
                </span>
              </p>
            )}

            {address && onlineUrl && (
              <p className="flex items-center min-w-0 gap-1 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                <MapPinHouseIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate" title="Hybrid">
                  {address}, Hybrid
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Capacity + status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
            <Users className="w-4 h-4" aria-hidden />
            <span>{capacityLabel(joinedCount, min, max)}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            {showSponsoredBadge && (
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
        <div className="flex items-center gap-3 mt-2">
          <CategoryPills categories={categories ?? []} />
          <TagPills tags={tags ?? []} />
        </div>
      </motion.div>

      {/* Modal */}
      {details}
    </>
  );
}
