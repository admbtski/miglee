'use client';

import { Avatar } from '@/components/ui/avatar';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { CapacityBadge } from '@/components/ui/capacity-badge';
import { FavouriteButton } from '@/components/ui/favourite-button';
import { HybridLocationIcon } from '@/components/ui/icons/hybrid-location-icon';
import { Plan } from '@/components/ui/plan-theme';
import { StatusBadge } from '@/components/ui/status-badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { EventCountdownPill } from '@/features/intents/components/event-countdown-pill';
import { AddressVisibility } from '@/lib/api/__generated__/react-query-update';
import { buildAvatarUrl, buildIntentCoverUrl } from '@/lib/media/url';
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
import { memo, useCallback, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

export interface EventCardProps {
  intentId?: string;
  lat?: number | null;
  lng?: number | null;
  startISO: string;
  endISO: string;
  title: string;
  categories: string[];
  address?: string;
  avatarKey: string | null;
  avatarBlurhash?: string | null;
  organizerName: string;
  verifiedAt?: string;
  plan?: Plan;
  coverKey?: string | null;
  coverBlurhash?: string | null;
  joinedCount: number;
  min: number;
  max: number;
  canJoin: boolean;
  isFull: boolean;
  isOngoing: boolean;
  isCanceled: boolean;
  isDeleted: boolean;
  hasStarted: boolean;
  joinOpensMinutesBeforeStart?: number | null;
  joinCutoffMinutesBeforeStart?: number | null;
  allowJoinLate?: boolean;
  lateJoinCutoffMinutesAfterStart?: number | null;
  joinManuallyClosed?: boolean;
  isHybrid: boolean;
  isOnline: boolean;
  isOnsite: boolean;
  addressVisibility: AddressVisibility;
  isFavourite?: boolean;
  className?: string;
  onHover?: (
    intentId: string | null,
    lat?: number | null,
    lng?: number | null
  ) => void;
}

type AddressVisibilityMeta = {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  canShow: boolean;
};

function getAddressVisibilityMeta(
  av: AddressVisibility
): AddressVisibilityMeta {
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

function getPlanRingClasses(
  plan: Plan,
  isCanceled: boolean,
  isDeleted: boolean
): string {
  if (isCanceled || isDeleted || plan === 'default') {
    return '';
  }

  return 'ring-2 ring-amber-500/30 shadow-[0_0_16px_rgba(245,158,11,0.35),0_0_48px_rgba(245,158,11,0.2)]';
}

function getLocationDisplay(
  isHybrid: boolean,
  isOnsite: boolean,
  isOnline: boolean,
  avMeta: AddressVisibilityMeta,
  address: string | undefined,
  addressVisibility: AddressVisibility
): { Icon: React.ComponentType<{ className?: string }>; text: string } | null {
  if (isHybrid) {
    return {
      Icon: HybridLocationIcon,
      text: avMeta.canShow
        ? `${address?.split(',')[0]} • Online`
        : addressVisibility === 'AFTER_JOIN'
          ? 'Szczegóły po dołączeniu'
          : 'Szczegóły ukryte',
    };
  }

  if (isOnsite) {
    return {
      Icon: MapPin,
      text: avMeta.canShow
        ? (address?.split(',')[0] ?? '')
        : addressVisibility === 'AFTER_JOIN'
          ? 'Adres po dołączeniu'
          : 'Adres ukryty',
    };
  }

  if (isOnline) {
    return {
      Icon: WifiIcon,
      text: avMeta.canShow
        ? 'Online'
        : addressVisibility === 'AFTER_JOIN'
          ? 'Online (po dołączeniu)'
          : 'Online (ukryte)',
    };
  }

  return null;
}

export const EventCard = memo(function EventCard({
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

  const locationDisplay = useMemo(
    () =>
      getLocationDisplay(
        isHybrid,
        isOnsite,
        isOnline,
        avMeta,
        address,
        addressVisibility
      ),
    [isHybrid, isOnsite, isOnline, avMeta, address, addressVisibility]
  );

  const isInactive = isCanceled || isDeleted;
  const isPremium = plan !== 'default';
  const maxCategoriesToShow = isPremium ? 1 : 2;
  const remainingCategoriesCount = categories.length - maxCategoriesToShow;

  return (
    <motion.div
      layout="size"
      whileHover={{
        y: isInactive ? 0 : -4,
        scale: isInactive ? 1 : 1.015,
      }}
      className={twMerge(
        'relative w-full rounded-2xl p-4 flex flex-col gap-2',
        'ring-1 ring-white/5 dark:ring-white/5',
        'bg-white dark:bg-neutral-900',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        'select-none',
        isInactive && 'saturate-0',
        getPlanRingClasses(plan, isCanceled, isDeleted),
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
      {intentId && (
        <Link
          href={`/intent/${encodeURIComponent(intentId)}`}
          className="absolute inset-0 z-[1] rounded-2xl"
          aria-label={`Szczegóły wydarzenia: ${organizerName}`}
        />
      )}

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

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/0 to-black/40" />

        {isInactive && (
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

        {(isPremium || categories.length > 0) && (
          <div className="absolute top-3 left-3 right-12 z-10">
            <div className="flex flex-wrap gap-1.5">
              {!isInactive && (
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

              {isPremium && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-sm px-2 py-[2px] text-[11px] font-medium text-white shadow-lg"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  <Sparkles className="w-3 h-3" />
                  Promowane
                </span>
              )}

              {categories.slice(0, maxCategoriesToShow).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-2 py-[2px] text-[11px] font-medium text-white shadow-lg"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {cat}
                </span>
              ))}

              {remainingCategoriesCount > 0 && (
                <span
                  className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-2 py-[2px] text-[11px] font-medium text-white shadow-lg"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  +{remainingCategoriesCount}
                </span>
              )}
            </div>
          </div>
        )}

        {organizerName && (
          <div className="absolute bottom-3 left-3 z-10">
            <Link
              href={`/u/${organizerName}`}
              className="flex items-center gap-1.5 group relative z-[2]"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar
                url={buildAvatarUrl(avatarKey, 'xs')}
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

      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold leading-tight text-neutral-900 dark:text-white line-clamp-2">
          {title}
        </h3>

        <div className="flex flex-col gap-1 text-xs text-neutral-600 dark:text-neutral-400">
          {locationDisplay && (
            <div className="flex items-center gap-1 min-w-0">
              <locationDisplay.Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs truncate">{locationDisplay.text}</span>
            </div>
          )}

          <div className="flex items-center gap-1 truncate">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-xs truncate">
              {formatDateRange(startISO, endISO)} • {humanDuration(start, end)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <CapacityBadge
            joinedCount={joinedCount}
            size="sm"
            min={min}
            max={max}
            isFull={isFull}
            canJoin={canJoin}
            statusReason={status.reason}
          />
          {!isInactive &&
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
});
