// EventCard.tsx
'use client';

import { Avatar } from '@/components/ui/avatar';
import { CapacityBadge } from '@/components/ui/capacity-badge';
import { FavouriteButton } from '@/components/ui/favourite-button';
import { HybridLocationIcon } from '@/components/ui/icons/hybrid-location-icon';
import { Plan } from '@/components/ui/plan-theme';
import { StatusBadge } from '@/components/ui/status-badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { EventCountdownPill } from '@/features/intents/components/event-countdown-pill';
import { AddressVisibility } from '@/lib/api/__generated__/react-query-update';
import { formatDateRange, humanDuration, parseISO } from '@/lib/utils/date';
import { computeEventStateAndStatus } from '@/lib/utils/event-status';
import { motion } from 'framer-motion';
import {
  Calendar,
  Eye,
  EyeOff,
  MapPin,
  Sparkles,
  UserCheck,
  Wifi as WifiIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { buildAvatarUrl, buildIntentCoverUrl } from '@/lib/media/url';

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
  avatarKey: string;
  avatarBlurhash?: string | null;
  organizerName: string;
  verifiedAt?: string;
  plan?: Plan;

  // Cover image
  coverKey?: string | null;
  coverBlurhash?: string | null;

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
  avatarKey,
  avatarBlurhash,
  organizerName,
  title,
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
  isFavourite = false,
  isHybrid,
  isOnline,
  isOnsite,
  coverKey,
  coverBlurhash,
  onHover,
}: EventCardProps) {
  const start = useMemo(() => parseISO(startISO), [startISO]);
  const end = useMemo(() => parseISO(endISO), [endISO]);

  // Compute event status using shared utility
  const { status } = useMemo(
    () =>
      computeEventStateAndStatus({
        now: new Date(),
        startAt: start,
        endAt: end,
        isDeleted,
        isCanceled,
        isOngoing,
        hasStarted,
        joinOpensMinutesBeforeStart,
        joinCutoffMinutesBeforeStart,
        allowJoinLate,
        lateJoinCutoffMinutesAfterStart,
        joinManuallyClosed,
        min,
        max,
        joinedCount,
        joinMode: 'OPEN',
      }),
    [
      start,
      end,
      isDeleted,
      isCanceled,
      isOngoing,
      hasStarted,
      joinOpensMinutesBeforeStart,
      joinCutoffMinutesBeforeStart,
      allowJoinLate,
      lateJoinCutoffMinutesAfterStart,
      joinManuallyClosed,
      min,
      max,
      joinedCount,
    ]
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
        y: isDeleted || isCanceled ? 0 : -4,
        scale: isDeleted || isCanceled ? 1 : 1.015,
      }}
      className={twMerge(
        'relative w-full rounded-2xl p-4 flex flex-col gap-2',
        // Unified border styling
        'ring-1 ring-white/5 dark:ring-white/5',
        // Subtle background
        'bg-white dark:bg-neutral-900',
        // Base shadow
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        'select-none',
        isCanceled && 'saturate-0',
        isDeleted && 'saturate-0',
        // Premium plan highlight with VERY VISIBLE colored glow
        !isCanceled && !isDeleted && plan !== 'default' && 'ring-2',
        !isCanceled &&
          !isDeleted &&
          plan === 'basic' &&
          'ring-amber-500/30 shadow-[0_0_16px_rgba(245,158,11,0.35),0_0_48px_rgba(245,158,11,0.2)]',
        !isCanceled &&
          !isDeleted &&
          plan === 'plus' &&
          'ring-amber-500/30 shadow-[0_0_16px_rgba(245,158,11,0.35),0_0_48px_rgba(245,158,11,0.2)]',
        !isCanceled &&
          !isDeleted &&
          plan === 'premium' &&
          'ring-amber-500/30 shadow-[0_0_16px_rgba(245,158,11,0.35),0_0_48px_rgba(245,158,11,0.2)]',
        className
      )}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-plan={plan}
    >
      {/* Invisible overlay link - makes entire card clickable */}
      {intentId && (
        <Link
          href={`/intent/${encodeURIComponent(intentId)}`}
          className="absolute inset-0 z-[1] rounded-2xl"
          aria-label={`Szczegóły wydarzenia: ${organizerName}`}
        />
      )}
      {/* Cover Image - Visual Only (no text info) */}
      <div className="relative -mx-4 -mt-4 mb-3 h-40 overflow-hidden rounded-t-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
        {coverKey ? (
          <BlurHashImage
            src={buildIntentCoverUrl(coverKey, 'card')}
            blurhash={coverBlurhash}
            alt={title}
            className="h-full w-full object-cover brightness-90 contrast-90"
            width={480}
            height={270}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20" />
        )}
        {/* Subtle gradient for better visibility of category tags (top) and author (bottom) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/0 to-black/40" />

        {/* Cancelled/Deleted Overlay */}
        {(isCanceled || isDeleted) && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <p className="text-white font-semibold text-md">
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

        {/* Category Tags - Top Left */}
        {(plan !== 'default' || categories.length > 0) && (
          <div className="absolute top-3 left-3 right-12 z-10">
            <div className="flex flex-wrap gap-1.5">
              {!isCanceled && !isDeleted && (
                <EventCountdownPill
                  startAt={start}
                  endAt={end}
                  size="sm"
                  joinOpensMinutesBeforeStart={joinOpensMinutesBeforeStart}
                  joinCutoffMinutesBeforeStart={joinCutoffMinutesBeforeStart}
                  allowJoinLate={allowJoinLate}
                  lateJoinCutoffMinutesAfterStart={
                    lateJoinCutoffMinutesAfterStart
                  }
                  joinManuallyClosed={joinManuallyClosed}
                  isCanceled={isCanceled}
                  isDeleted={isDeleted}
                />
              )}
              {/* Promoted tag for premium plans */}
              {plan !== 'default' && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-sm px-2 py-[2px] text-[11px] font-medium text-white shadow-lg"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  <Sparkles className="w-3 h-3" />
                  Promowane
                </span>
              )}
              {/* Regular category tags - show only 1 if promoted, otherwise 2 */}
              {categories.slice(0, plan !== 'default' ? 1 : 2).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-2 py-[2px] text-[11px] font-medium text-white shadow-lg"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {cat}
                </span>
              ))}
              {/* Show count of remaining categories */}
              {((plan !== 'default' && categories.length > 1) ||
                (plan === 'default' && categories.length > 2)) && (
                <span
                  className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-2 py-[2px] text-[11px] font-medium text-white shadow-lg"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  +
                  {plan !== 'default'
                    ? categories.length - 1
                    : categories.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Author Row - Bottom Left on Cover (Subtle) */}
        {organizerName && (
          <div className="absolute bottom-3 left-3 z-10">
            <Link
              href={`/u/${organizerName}`}
              className="flex items-center gap-1.5 group relative z-[2]"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar
                url={buildAvatarUrl(avatarKey, 'sm')}
                blurhash={avatarBlurhash}
                alt={organizerName}
                size={24}
                className="opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[11px] font-normal text-white/80 leading-tight truncate group-hover:text-white transition-colors"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {organizerName}
                </span>
                {verifiedAt && (
                  <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                    <VerifiedBadge
                      size="xs"
                      variant="icon"
                      verifiedAt={verifiedAt}
                    />
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Top Right Corner - Favourite Button */}
      {intentId && (
        <div
          className="absolute top-2 right-2 z-[2]"
          onClick={(e) => e.stopPropagation()}
        >
          <FavouriteButton
            intentId={intentId}
            isFavourite={isFavourite}
            size="sm"
          />
        </div>
      )}

      {/* Content Section - Informational Body */}
      <div className="flex flex-col gap-1.5">
        {/* (B) Title - ONLY place for title */}
        <h3 className="text-base font-semibold leading-tight text-neutral-900 dark:text-white line-clamp-2">
          {title}
        </h3>

        {/* (C) Meta - Location and Time stacked */}
        <div className="flex flex-col gap-1 text-xs text-neutral-600 dark:text-neutral-400">
          {/* Location Row */}
          {(isHybrid || isOnsite || isOnline) && (
            <div className="flex items-center gap-1 min-w-0">
              {/* Hybrid: address • Online / Szczegóły po dołączeniu / Szczegóły ukryte */}
              {isHybrid && (
                <>
                  <HybridLocationIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-xs truncate">
                    {avMeta.canShow
                      ? `${address?.split(',')[0]} • Online`
                      : addressVisibility === 'AFTER_JOIN'
                        ? 'Szczegóły po dołączeniu'
                        : 'Szczegóły ukryte'}
                  </span>
                </>
              )}
              {/* Onsite: 📍 address / 📍 Adres po dołączeniu / 📍 Adres ukryty */}
              {isOnsite && !isHybrid && (
                <>
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-xs truncate">
                    {avMeta.canShow
                      ? address?.split(',')[0]
                      : addressVisibility === 'AFTER_JOIN'
                        ? 'Adres po dołączeniu'
                        : 'Adres ukryty'}
                  </span>
                </>
              )}
              {/* Online: Online / Online (po dołączeniu) / Online (ukryte) */}
              {isOnline && !isHybrid && !isOnsite && (
                <>
                  <WifiIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-xs truncate">
                    {avMeta.canShow
                      ? 'Online'
                      : addressVisibility === 'AFTER_JOIN'
                        ? 'Online (po dołączeniu)'
                        : 'Online (ukryte)'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Time Row */}
          <div className="flex items-center gap-1 truncate">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-xs truncate">
              {formatDateRange(startISO, endISO)} • {humanDuration(start, end)}
            </span>
          </div>
        </div>

        {/* (E) Bottom Badges - Capacity & Status */}
        <div className="flex items-center  gap-2 mt-1 flex-wrap">
          <CapacityBadge
            joinedCount={joinedCount}
            size="sm"
            min={min}
            max={max}
            isFull={isFull}
            canJoin={canJoin}
            statusReason={status.reason}
          />
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
      </div>
    </motion.div>
  );
}
