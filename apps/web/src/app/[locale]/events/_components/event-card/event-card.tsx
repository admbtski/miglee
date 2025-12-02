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
import { getCardHighlightClasses } from '@/lib/utils/is-boost-active';
import { motion } from 'framer-motion';
import {
  Calendar,
  Eye,
  EyeOff,
  MapPin,
  Sparkles,
  UserCheck,
  Users,
  Wifi as WifiIcon,
} from 'lucide-react';
import Link from 'next/link';
import { memo, useCallback, useMemo } from 'react';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { formatCapacityString } from '@/lib/utils/capacity-formatter';
import { twMerge } from 'tailwind-merge';

export interface EventCardProps {
  intentId?: string;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
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
  boostedAt?: string | null; // ISO timestamp of last boost
  highlightColor?: string | null; // Hex color for custom highlight ring
  coverKey?: string | null;
  coverBlurhash?: string | null;
  joinedCount: number;
  min?: number | null;
  max?: number | null;
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

function getLocationDisplay(
  radiusKm: number | null | undefined,
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
        ? `${address?.split(',')[0]}${radiusKm ? ` ~ ${radiusKm} km` : ''} • Online`
        : addressVisibility === 'AFTER_JOIN'
          ? 'Szczegóły po dołączeniu'
          : 'Szczegóły ukryte',
    };
  }

  if (isOnsite) {
    return {
      Icon: MapPin,
      text: avMeta.canShow
        ? `${address?.split(',')[0]}${radiusKm ? ` ~ ${radiusKm} km` : ''}`
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

/**
 * Check if a boost is still active (< 24 hours old)
 * @param boostedAtISO - ISO timestamp of when the event was boosted
 * @returns true if boost is active, false otherwise
 */
function isBoostActive(boostedAtISO: string | null | undefined): boolean {
  if (!boostedAtISO) return false;

  const boostedAt = new Date(boostedAtISO);
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return boostedAt >= twentyFourHoursAgo;
}

export const EventCard = memo(function EventCard({
  intentId,
  lat,
  lng,
  startISO,
  endISO,
  radiusKm,
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
  plan,
  boostedAt,
  highlightColor,
  addressVisibility,
  isFavourite = false,
  isHybrid,
  isOnline,
  isOnsite,
  coverKey,
  coverBlurhash,
  onHover,
}: EventCardProps) {
  const { locale } = useI18n();

  const start = useMemo(() => parseISO(startISO), [startISO]);
  const end = useMemo(() => parseISO(endISO), [endISO]);

  // Check if boost is active (< 24h)
  const isBoosted = useMemo(() => isBoostActive(boostedAt), [boostedAt]);

  // Get highlight ring classes (only if boosted)
  const highlightRing = useMemo(
    () =>
      isBoosted && !isCanceled && !isDeleted
        ? getCardHighlightClasses(highlightColor, isBoosted)
        : { className: '' },
    [isBoosted, isCanceled, isDeleted, highlightColor]
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
        radiusKm,
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
  const maxCategoriesToShow = isBoosted ? 1 : 2;
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
        'bg-white dark:bg-zinc-900',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        'select-none',
        'transition-colors duration-500',
        isInactive && 'saturate-0',
        highlightRing.className,
        className
      )}
      style={{
        ...highlightRing.style,
      }}
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
          href={`/${locale}/intent/${encodeURIComponent(intentId)}`}
          className="absolute inset-0 z-[1] rounded-2xl"
          aria-label={`Szczegóły wydarzenia: ${organizerName}`}
        />
      )}

      <div className="relative h-40 mb-3 -mx-4 -mt-4 overflow-hidden rounded-t-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
        {coverKey ? (
          <BlurHashImage
            src={buildIntentCoverUrl(coverKey, 'card')}
            blurhash={coverBlurhash}
            alt={title}
            className="object-cover w-full h-full brightness-90 contrast-90"
            width={480}
            height={270}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-zinc-400 dark:text-zinc-600 opacity-40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/0 to-black/40" />

        {isInactive && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <p className="font-semibold text-white text-md">
                {isDeleted ? 'Usunięte' : 'Odwołane'}
              </p>
              <p className="mt-1 text-xs text-white/60">
                {isDeleted
                  ? 'To wydarzenie zostało usunięte'
                  : 'To wydarzenie zostało odwołane'}
              </p>
            </div>
          </div>
        )}

        {(isBoosted || categories.length > 0) && (
          <div className="absolute z-10 top-3 left-3 right-12">
            <div className="flex flex-wrap gap-1">
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

              {isBoosted && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-white shadow-sm select-none"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Promowane
                </span>
              )}

              {categories.slice(0, maxCategoriesToShow).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-white shadow-sm select-none"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {cat}
                </span>
              ))}

              {remainingCategoriesCount > 0 && (
                <span
                  className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-white shadow-sm select-none"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  +{remainingCategoriesCount}
                </span>
              )}
            </div>
          </div>
        )}

        {organizerName && (
          <div className="absolute z-10 bottom-3 left-3">
            <Link
              href={`/${locale}/u/${organizerName}`}
              className="flex items-center gap-1.5 group relative z-[2]"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar
                url={buildAvatarUrl(avatarKey, 'xs')}
                blurhash={avatarBlurhash}
                alt={organizerName}
                size={24}
                className="transition-opacity opacity-90 group-hover:opacity-100"
              />
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[11px] font-normal text-white/80 leading-tight truncate group-hover:text-white transition-colors"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {organizerName}
                </span>
                {verifiedAt && (
                  <div className="transition-opacity opacity-70 group-hover:opacity-100">
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

      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold leading-tight text-zinc-900 dark:text-white line-clamp-2">
          {title}
        </h3>

        <div className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          {locationDisplay && (
            <div className="flex items-center min-w-0 gap-1">
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
          <div className="flex items-center gap-1 truncate">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-xs truncate">
              {formatCapacityString(joinedCount, min, max)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
