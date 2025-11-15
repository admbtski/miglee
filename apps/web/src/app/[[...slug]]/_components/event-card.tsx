// EventCard.tsx
'use client';

import { Avatar } from '@/components/ui/avatar';
import { CapacityBadge } from '@/components/ui/capacity-badge';
import { FavouriteButton } from '@/components/ui/favourite-button';
import { planAnimationConfig } from '@/components/ui/plan-animations';
import { PlanBadge } from '@/components/ui/plan-badge';
import { Plan } from '@/components/ui/plan-theme';
import { StatusBadge } from '@/components/ui/status-badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { EventCountdownPill } from '@/features/intents/components/event-countdown-pill';
import { AddressVisibility } from '@/lib/api/__generated__/react-query-update';
import { formatDateRange, humanDuration, parseISO } from '@/lib/utils/date';
import { computeJoinState } from '@/lib/utils/intent-join-state';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Eye,
  EyeOff,
  MapPin,
  UserCheck,
  Wifi as WifiIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyboardEvent, useCallback, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

/* ───────────────────────────── Types ───────────────────────────── */

export interface EventCardProps {
  // Core identification
  intentId?: string;
  lat?: number | null;
  lng?: number | null;

  // Event details
  startISO: string;
  endISO: string;
  title: string;
  description: string;
  categories: string[];
  address?: string;

  // Organizer info
  avatarUrl: string;
  organizerName: string;
  verifiedAt?: string;
  plan?: Plan;

  // Capacity & joining
  joinedCount: number;
  min: number;
  max: number;
  canJoin: boolean;
  isFull: boolean;

  // Event state
  isOngoing: boolean;
  isCanceled: boolean;
  isDeleted: boolean;
  hasStarted: boolean;

  // Join window settings
  joinOpensMinutesBeforeStart?: number | null;
  joinCutoffMinutesBeforeStart?: number | null;
  allowJoinLate?: boolean;
  lateJoinCutoffMinutesAfterStart?: number | null;
  joinManuallyClosed?: boolean;

  // Location type
  isHybrid: boolean;
  isOnline: boolean;
  isOnsite: boolean;
  addressVisibility: AddressVisibility;

  // UI options
  showSponsoredBadge?: boolean;
  isFavourite?: boolean;
  className?: string;

  // Callbacks
  onHover?: (
    intentId: string | null,
    lat?: number | null,
    lng?: number | null
  ) => void;
}

/* ───────────────────────────── Utils ───────────────────────────── */

function getAddressVisibilityMeta(av: AddressVisibility) {
  const normalized = String(av).toUpperCase();

  if (normalized.includes('PUBLIC')) {
    return {
      label: 'Adres publiczny',
      Icon: Eye,
      canShow: true,
    };
  }

  if (normalized.includes('AFTER_JOIN')) {
    return {
      label: 'Adres po dołączeniu',
      Icon: UserCheck,
      canShow: false,
    };
  }

  return {
    label: 'Adres ukryty',
    Icon: EyeOff,
    canShow: false,
  };
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
  joinedCount,
  min,
  max,
  categories = [],
  className,
  verifiedAt,
  hasStarted,
  isFull,
  isOngoing,
  isCanceled,
  isDeleted,
  canJoin,
  joinOpensMinutesBeforeStart,
  joinCutoffMinutesBeforeStart,
  allowJoinLate,
  lateJoinCutoffMinutesAfterStart,
  joinManuallyClosed,
  plan = 'default',
  addressVisibility,
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

  const avMeta = useMemo(
    () => getAddressVisibilityMeta(addressVisibility),
    [addressVisibility]
  );

  return (
    <motion.div
      layout="size"
      whileHover={{
        y: canJoin ? planAnimationConfig.cardHover.liftY : 0,
        scale: canJoin ? planAnimationConfig.cardHover.scale : 1,
      }}
      className={twMerge(
        'relative w-full rounded-2xl p-4 flex flex-col gap-2',
        // Unified border styling
        'ring-1 ring-white/5 dark:ring-white/5',
        // Subtle background
        'bg-white dark:bg-neutral-900',
        // Unified shadow
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]',
        'cursor-pointer select-none',
        // Premium plan subtle highlight
        plan !== 'default' && 'ring-2',
        plan === 'basic' && 'ring-emerald-500/20',
        plan === 'plus' && 'ring-indigo-500/20',
        plan === 'premium' && 'ring-amber-500/20',
        className
      )}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
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
      {/* Cover Image with overlay content - Clean Magazine style */}
      <div className="relative -mx-4 -mt-4 mb-3 h-40 overflow-hidden rounded-t-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
        <img
          src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop"
          alt={title}
          className="h-full w-full object-cover brightness-90 contrast-90"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Universal gradient overlay - consistent contrast for all images */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/30 to-black/70" />

        {/* Cancelled/Deleted Overlay */}
        {(isCanceled || isDeleted) && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <p className="text-white font-semibold text-lg">
                {isDeleted ? 'Usunięte' : 'Odwołane'}
              </p>
              <p className="text-white/60 text-xs mt-1">
                {isDeleted
                  ? 'To wydarzenie zostało usunięte'
                  : 'To wydarzenie zostało odwołane'}
              </p>
            </div>
          </div>
        )}

        {/* Cover content - Title & Key Info */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          {/* Category Tags - MAX 2, elegant & subtle */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-2 py-[2px] text-[11px] font-medium text-white shadow-lg"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {cat}
                </span>
              ))}
              {categories.length > 2 && (
                <span
                  className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-2 py-[2px] text-[11px] font-medium text-white shadow-lg"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  +{categories.length - 2}
                </span>
              )}
            </div>
          )}

          <h3
            className="text-base font-semibold leading-tight text-white line-clamp-2 mb-1.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
          >
            {title}
          </h3>

          {/* Metadata Row: Date, Time & Location */}
          <div
            className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-white/60"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
          >
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDateRange(startISO, endISO)}</span>
            </div>
            <span className="text-white/40">·</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{humanDuration(start, end)}</span>
            </div>
            {/* Location on cover */}
            {(isOnsite || isHybrid) && (
              <>
                <span className="text-white/40">·</span>
                {avMeta.canShow ? (
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{address?.split(',')[0]}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <avMeta.Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-[11px]">{avMeta.label}</span>
                  </div>
                )}
              </>
            )}
            {/* Online indicator */}
            {isOnline && (
              <>
                <span className="text-white/40">·</span>
                <div className="flex items-center gap-1">
                  <WifiIcon className="h-3.5 w-3.5" />
                  <span>Online</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Right Corner - Favourite Button */}
      {intentId && (
        <div
          className="absolute top-2 right-2 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <FavouriteButton
            intentId={intentId}
            isFavourite={isFavourite}
            size="sm"
          />
        </div>
      )}

      {/* Content Section - Clean & Structured */}
      <div className="flex flex-col">
        {/* Author Row - Subtle & Elegant */}
        {organizerName && (
          <Link
            href={`/u/${organizerName}`}
            className="flex items-center gap-2 mb-2 group"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar
                url={avatarUrl}
                alt={organizerName}
                size={24}
                className="ring-1 ring-white/10"
              />
            </div>

            {/* Username */}
            <span className="text-[13px] text-neutral-600 dark:text-white/70 leading-tight truncate group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
              {organizerName}
            </span>

            {/* Verified Badge */}
            {verifiedAt && (
              <VerifiedBadge size="xs" variant="icon" verifiedAt={verifiedAt} />
            )}

            {/* Plan Badge - shown on md+ screens */}
            {showSponsoredBadge && plan && plan !== 'default' && (
              <div className="ml-auto hidden sm:block">
                <PlanBadge plan={plan} size="xs" variant="iconText" />
              </div>
            )}
          </Link>
        )}

        {/* Title */}
        <h3 className="text-base font-semibold leading-tight text-neutral-900 dark:text-white line-clamp-2 mb-1.5">
          {title}
        </h3>

        {/* Description */}
        <p
          className="text-xs leading-snug text-neutral-600 dark:text-neutral-400 line-clamp-1 mb-3"
          title={description}
        >
          {description}
        </p>

        {/* Capacity & Status Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CapacityBadge
              joinedCount={joinedCount}
              size="sm"
              min={min}
              max={max}
              isFull={isFull}
              canJoin={canJoin}
              statusReason={status.reason}
            />

            {/* Status Badge */}
            {!isCanceled &&
              !isDeleted &&
              status.reason !== 'FULL' &&
              status.reason !== 'OK' && (
                <StatusBadge
                  size="sm"
                  tone={status.tone}
                  reason={status.reason}
                  label={status.label}
                />
              )}
          </div>

          {/* Countdown */}
          {!isCanceled && !isDeleted && (
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
          )}
        </div>
      </div>
    </motion.div>
  );
}
