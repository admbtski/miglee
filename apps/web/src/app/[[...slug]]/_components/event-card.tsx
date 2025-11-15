// EventCard.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CapacityBadge } from '@/components/ui/capacity-badge';
import { CategoryPills, TagPills } from '@/components/ui/category-tag-pill';
import { LevelBadge, sortLevels } from '@/components/ui/level-badge';
import { PlanBadge } from '@/components/ui/plan-badge';
import { Plan, planTheme } from '@/components/ui/plan-theme';
import { planAnimationConfig } from '@/components/ui/plan-animations';
import { SimpleProgressBar } from '@/components/ui/simple-progress-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { computeJoinState } from '@/lib/utils/intent-join-state';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { EventCountdownPill } from '@/features/intents/components/event-countdown-pill';
import { Avatar } from '@/components/ui/avatar';
import { FavouriteButton } from '@/components/ui/favourite-button';
import {
  AddressVisibility,
  IntentMember,
  Level,
  MembersVisibility,
} from '@/lib/api/__generated__/react-query-update';
import { formatDateRange, humanDuration, parseISO } from '@/lib/utils/date';
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
import { KeyboardEvent, useCallback, useMemo } from 'react';

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
  inline?: boolean;
  onJoin?: () => void | Promise<void>;
  className?: string;
  verifiedAt?: string;

  isOngoing: boolean;
  isCanceled: boolean;
  isDeleted: boolean;
  hasStarted: boolean;
  withinLock: boolean;
  lockReason?: string | null;
  canJoin: boolean;
  isFull: boolean;

  // Join window settings
  joinOpensMinutesBeforeStart?: number | null;
  joinCutoffMinutesBeforeStart?: number | null;
  allowJoinLate?: boolean;
  lateJoinCutoffMinutesAfterStart?: number | null;
  joinManuallyClosed?: boolean;

  isHybrid: boolean;
  isOnline: boolean;
  isOnsite: boolean;

  levels: Level[];
  addressVisibility: AddressVisibility;
  membersVisibility: MembersVisibility;
  members?: IntentMember[];
  plan?: Plan;
  showSponsoredBadge?: boolean;
  isFavourite?: boolean;
  onHover?: (
    intentId: string | null,
    lat?: number | null,
    lng?: number | null
  ) => void;
}

/* ───────────────────────────── Utils ───────────────────────────── */

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
  lockReason,
  joinOpensMinutesBeforeStart,
  joinCutoffMinutesBeforeStart,
  allowJoinLate,
  lateJoinCutoffMinutesAfterStart,
  joinManuallyClosed,
  members = [],
  plan = 'default',
  addressVisibility,
  levels,
  membersVisibility, // info: przekazywane do modala
  showSponsoredBadge = true,
  isFavourite = false,
  isHybrid,
  isOnline,
  isOnsite,
  onHover,
}: EventCardProps) {
  const router = useRouter();

  const start = useMemo(() => parseISO(startISO), [startISO]);
  const end = useMemo(() => parseISO(endISO), [endISO]);

  // Compute join state using new logic with join window
  const joinState = useMemo(() => {
    // If canceled or deleted, skip computeJoinState
    if (isDeleted || isCanceled) {
      return null;
    }

    // Use new computeJoinState with join window logic
    return computeJoinState(new Date(), {
      startAt: start,
      endAt: end,
      joinOpensMinutesBeforeStart,
      joinCutoffMinutesBeforeStart,
      allowJoinLate: allowJoinLate ?? true,
      lateJoinCutoffMinutesAfterStart,
      joinManuallyClosed: joinManuallyClosed ?? false,
      min,
      max,
      joinedCount,
      joinMode: 'OPEN', // EventCard doesn't have joinMode, default to OPEN
    });
  }, [
    start,
    end,
    isDeleted,
    isCanceled,
    joinOpensMinutesBeforeStart,
    joinCutoffMinutesBeforeStart,
    allowJoinLate,
    lateJoinCutoffMinutesAfterStart,
    joinManuallyClosed,
    min,
    max,
    joinedCount,
  ]);

  // Map new joinState to old status format for StatusBadge
  const status = useMemo(() => {
    if (isDeleted)
      return {
        label: 'Usunięte',
        tone: 'error' as const,
        reason: 'DELETED' as const,
      };
    if (isCanceled)
      return {
        label: 'Odwołane',
        tone: 'warn' as const,
        reason: 'CANCELED' as const,
      };
    if (isOngoing)
      return {
        label: 'Trwa teraz',
        tone: 'info' as const,
        reason: 'ONGOING' as const,
      };

    if (joinState) {
      if (joinState.isManuallyClosed)
        return {
          label: 'Zablokowane',
          tone: 'error' as const,
          reason: 'LOCK' as const,
        };
      if (joinState.isBeforeOpen)
        return {
          label: 'Wkrótce',
          tone: 'warn' as const,
          reason: 'LOCK' as const,
        };
      if (joinState.isPreCutoffClosed)
        return {
          label: 'Zablokowane',
          tone: 'error' as const,
          reason: 'LOCK' as const,
        };
      if (joinState.isFull)
        return {
          label: 'Brak miejsc',
          tone: 'error' as const,
          reason: 'FULL' as const,
        };
    }

    if (hasStarted)
      return {
        label: 'Rozpoczęte',
        tone: 'error' as const,
        reason: 'STARTED' as const,
      };
    return { label: 'Dostępne', tone: 'ok' as const, reason: 'OK' as const };
  }, [isDeleted, isCanceled, isOngoing, hasStarted, joinState]);

  const fill = useMemo(
    () => Math.min(100, Math.round((joinedCount / Math.max(1, max)) * 100)),
    [joinedCount, max]
  );

  const handleCardClick = useCallback(() => {
    if (intentId) {
      router.push(`/intent/${encodeURIComponent(intentId)}`);
    }
  }, [intentId, router]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardClick();
      }
    },
    [handleCardClick]
  );

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
      <div
        className={clsx(
          'relative flex items-center gap-4 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 text-sm cursor-pointer select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 rounded-lg',
          className
        )}
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={`Szczegóły wydarzenia: ${organizerName}`}
        data-plan={plan}
      >
        <Link
          href={`/u/${organizerName}`}
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar url={avatarUrl} alt={`Organizator: ${organizerName}`} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/u/${organizerName}`}
            className="font-medium truncate text-neutral-900 transition-colors hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400"
            title={organizerName}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="inline-flex items-center gap-1.5 max-w-full">
              <span className="truncate">{organizerName}</span>
              <VerifiedBadge verifiedAt={verifiedAt} />
            </span>
          </Link>
          <p className="text-xs truncate text-neutral-600 dark:text-neutral-400">
            {title}
          </p>

          {/* zakres + lokalizacja */}
          <p className="text-xs truncate text-neutral-600 dark:text-neutral-400">
            {formatDateRange(startISO, endISO)} • {humanDuration(start, end)}
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
    );
  }

  return (
    <motion.div
      layout="size"
      whileHover={{
        y: canJoin ? planAnimationConfig.cardHover.liftY : 0,
        scale: canJoin ? planAnimationConfig.cardHover.scale : 1,
      }}
      className={clsx(
        'relative w-full rounded-2xl p-4 flex flex-col gap-2 ring-1',
        planStyling.ring,
        planStyling.bg,
        plan === 'default' && planStyling?.glow,
        'cursor-pointer select-none',
        className
      )}
      style={
        plan && plan !== 'default'
          ? {
              boxShadow: planAnimationConfig.glowingShadow.shadows[plan].min,
            }
          : undefined
      }
      animate={
        plan && plan !== 'default'
          ? {
              boxShadow: [
                planAnimationConfig.glowingShadow.shadows[plan].min,
                planAnimationConfig.glowingShadow.shadows[plan].mid,
                planAnimationConfig.glowingShadow.shadows[plan].max,
                planAnimationConfig.glowingShadow.shadows[plan].mid,
                planAnimationConfig.glowingShadow.shadows[plan].min,
              ],
            }
          : undefined
      }
      transition={{
        // Hover transition for y and scale
        type: 'spring',
        stiffness: planAnimationConfig.cardHover.spring.stiffness,
        damping: planAnimationConfig.cardHover.spring.damping,
        mass: planAnimationConfig.cardHover.spring.mass,
        // BoxShadow animation - synchronized with shimmer (4s cycle)
        boxShadow:
          plan && plan !== 'default'
            ? {
                duration: planAnimationConfig.glowingShadow.duration,
                repeat: Infinity,
                ease: planAnimationConfig.glowingShadow.easing,
                times: [0, 0.25, 0.5, 0.75, 1], // Smooth progression through keyframes
              }
            : undefined,
      }}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`Szczegóły wydarzenia: ${organizerName}`}
      data-plan={plan}
    >
      {/* Animated gradient overlay for premium plans */}
      {plan && plan !== 'default' && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            className={clsx(
              'absolute inset-0',
              plan === 'basic' &&
                'bg-gradient-to-br from-emerald-400/20 via-emerald-500/5 to-emerald-600/20',
              plan === 'plus' &&
                'bg-gradient-to-br from-indigo-400/20 via-indigo-500/5 to-indigo-600/20',
              plan === 'premium' &&
                'bg-gradient-to-br from-amber-400/25 via-amber-500/8 to-amber-600/25'
            )}
            initial={{ opacity: 0.2, scale: 1 }}
            animate={{
              opacity: planAnimationConfig.gradientPulse.opacityRange,
              scale: planAnimationConfig.gradientPulse.scaleRange,
            }}
            transition={{
              duration: planAnimationConfig.gradientPulse.duration,
              repeat: Infinity,
              ease: planAnimationConfig.gradientPulse.easing,
            }}
          />
        </div>
      )}

      {/* Shimmer effect for premium plans - continuous animation */}
      {plan && plan !== 'default' && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            className={clsx(
              'absolute -inset-full',
              'bg-gradient-to-r',
              plan === 'basic' &&
                'from-transparent via-emerald-400/20 to-transparent',
              plan === 'plus' &&
                'from-transparent via-indigo-400/25 to-transparent',
              plan === 'premium' &&
                'from-transparent via-amber-400/30 to-transparent'
            )}
            animate={{
              x: ['-100%', '200%'],
              opacity: [0, planAnimationConfig.shimmer.maxOpacity, 0],
            }}
            transition={{
              duration: planAnimationConfig.shimmer.duration,
              repeat: Infinity,
              repeatDelay: planAnimationConfig.shimmer.repeatDelay,
              ease: planAnimationConfig.shimmer.easing,
            }}
          />
        </div>
      )}

      {/* Top Right Corner - Plan Badge & Favourite Button */}
      <div className="absolute -top-3 -right-1 z-10 flex items-center gap-1">
        {/* Plan Badge with continuous pulse animation */}
        {showSponsoredBadge && plan && plan !== 'default' && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: planAnimationConfig.badge.scaleRange,
              rotate: planAnimationConfig.badge.rotateRange,
            }}
            transition={{
              scale: {
                duration: planAnimationConfig.badge.duration,
                repeat: Infinity,
                repeatDelay: planAnimationConfig.badge.repeatDelay,
                ease: planAnimationConfig.badge.easing,
              },
              rotate: {
                duration: planAnimationConfig.badge.duration,
                repeat: Infinity,
                repeatDelay: planAnimationConfig.badge.repeatDelay,
                ease: planAnimationConfig.badge.easing,
              },
            }}
            whileHover={{
              scale: planAnimationConfig.badge.hoverScale,
              rotate: planAnimationConfig.badge.hoverRotateRange,
              transition: {
                duration: planAnimationConfig.badge.hoverDuration,
              },
            }}
          >
            <PlanBadge plan={plan} size="sm" variant="icon" />
          </motion.div>
        )}

        {/* Favourite Button */}
        {intentId && (
          <div onClick={(e) => e.stopPropagation()}>
            <FavouriteButton
              intentId={intentId}
              isFavourite={isFavourite}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Range + duration */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center min-w-0 gap-1.5 overflow-hidden text-sm text-neutral-600 dark:text-neutral-400">
          <Calendar className="w-4 h-4 shrink-0 align-middle" />
          <span className="font-medium truncate text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
            {formatDateRange(startISO, endISO)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
          <Clock className="w-4 h-4 shrink-0 align-middle" />
          <span>{humanDuration(start, end)}</span>
        </div>
      </div>

      {/* Organizer & description + location */}
      <div className="flex items-start min-w-0 gap-3 mt-1">
        <Link
          href={`/u/${organizerName}`}
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar url={avatarUrl} alt="Organizer" size={48} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/u/${organizerName}`}
            className="text-sm font-medium truncate text-neutral-900 transition-colors hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400"
            title={organizerName}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="inline-flex items-center max-w-full gap-1.5">
              <VerifiedBadge size="sm" variant="icon" verifiedAt={verifiedAt} />
              <span className="truncate">{organizerName}</span>
            </span>
          </Link>

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

      {/* Countdown Timer Pill */}
      <EventCountdownPill
        startAt={start}
        endAt={end}
        size="sm"
        joinOpensMinutesBeforeStart={joinOpensMinutesBeforeStart}
        joinCutoffMinutesBeforeStart={joinCutoffMinutesBeforeStart}
        allowJoinLate={allowJoinLate}
        lateJoinCutoffMinutesAfterStart={lateJoinCutoffMinutesAfterStart}
        joinManuallyClosed={joinManuallyClosed}
        isCanceled={isCanceled}
        isDeleted={isDeleted}
      />

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
  );
}
