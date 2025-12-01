/**
 * Individual intent item in map popup - styled to match EventCard
 */

import { Avatar } from '@/components/ui/avatar';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { FavouriteButton } from '@/components/ui/favourite-button';
import { HybridLocationIcon } from '@/components/ui/icons/hybrid-location-icon';
import { Plan } from '@/components/ui/plan-theme';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { EventCountdownPill } from '@/features/intents/components/event-countdown-pill';
import {
  AddressVisibility,
  Level as GqlLevel,
} from '@/lib/api/__generated__/react-query-update';
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
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

export type PopupIntent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  address?: string | null;
  radiusKm?: number | null;
  joinedCount?: number | null;
  min?: number | null;
  max?: number | null;
  owner?: {
    name?: string | null;
    avatarKey?: string | null;
    avatarBlurhash?: string | null;
    verifiedAt?: string | null;
  } | null;
  lat?: number | null;
  lng?: number | null;
  isCanceled: boolean;
  isDeleted: boolean;
  isFull: boolean;
  isOngoing: boolean;
  hasStarted: boolean;
  withinLock: boolean;
  lockReason?: string | null;
  canJoin?: boolean | null;

  // Join window settings
  joinOpensMinutesBeforeStart?: number | null;
  joinCutoffMinutesBeforeStart?: number | null;
  allowJoinLate?: boolean;
  lateJoinCutoffMinutesAfterStart?: number | null;
  joinManuallyClosed?: boolean;

  levels?: GqlLevel[] | null;
  plan?: Plan | null;
  boostedAt?: string | null; // ISO timestamp of last boost
  highlightColor?: string | null; // Hex color for custom highlight ring
  meetingKind?: 'ONSITE' | 'ONLINE' | 'HYBRID' | null;
  isHybrid?: boolean;
  isOnline?: boolean;
  isOnsite?: boolean;
  addressVisibility?: AddressVisibility | null;
  categorySlugs?: string[] | null;
  coverKey?: string | null;
  coverBlurhash?: string | null;
  isFavourite?: boolean;
};

export interface PopupItemProps {
  intent: PopupIntent;
  onClick?: (id: string) => void;
}

type AddressVisibilityMeta = {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  canShow: boolean;
};

function getAddressVisibilityMeta(
  av: AddressVisibility | null | undefined
): AddressVisibilityMeta {
  if (!av) {
    return {
      label: 'Adres publiczny',
      Icon: Eye,
      canShow: true,
    };
  }

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
  address: string | null | undefined,
  addressVisibility: AddressVisibility | null | undefined
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
 * Format capacity label for event cards
 * Handles all combinations of min/max being null or set
 */
function formatCapacityLabel(
  joinedCount: number,
  min: number | null | undefined,
  max: number | null | undefined
): string {
  // Both null or undefined - unlimited
  if (
    (min === null || min === undefined) &&
    (max === null || max === undefined)
  ) {
    return `${joinedCount} • brak limitu uczestników`;
  }

  // Only min is null/undefined - show max only
  if (min === null || min === undefined) {
    if (max !== null && max !== undefined) {
      const isFull = joinedCount >= max;
      const available = Math.max(0, max - joinedCount);
      return isFull
        ? `Brak miejsc • ${joinedCount} / ${max}`
        : `${joinedCount} / ${max} • ${available} wolne`;
    }
  }

  // Only max is null/undefined - show min only
  if (max === null || max === undefined) {
    if (min !== null && min !== undefined) {
      return `${joinedCount} • minimum ${min} osób`;
    }
  }

  // Both set - standard display
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    const isFull = joinedCount >= max;
    const available = Math.max(0, max - joinedCount);
    return isFull
      ? `Brak miejsc • ${joinedCount} / ${max}`
      : `${joinedCount} / ${max} • ${available} wolne`;
  }

  // Fallback (shouldn't happen)
  return `${joinedCount} uczestników`;
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

export function PopupItem({ intent, onClick }: PopupItemProps) {
  const {
    startAt,
    endAt,
    isCanceled,
    isDeleted,
    isFull,
    isOngoing,
    hasStarted,
    joinedCount: joinedCountRaw,
    max,
    min,
    radiusKm,
    boostedAt,
    highlightColor,
    isHybrid = false,
    isOnline = false,
    isOnsite = false,
    addressVisibility,
    address,
    joinOpensMinutesBeforeStart,
    joinCutoffMinutesBeforeStart,
    allowJoinLate,
    lateJoinCutoffMinutesAfterStart,
    joinManuallyClosed,
  } = intent;

  const joinedCount = joinedCountRaw ?? 0;

  const start = useMemo(() => parseISO(startAt), [startAt]);
  const end = useMemo(() => parseISO(endAt), [endAt]);

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
        min: min ?? 1,
        max: max ?? 99999,
        joinedCount: joinedCount,
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
    [radiusKm, isHybrid, isOnsite, isOnline, avMeta, address, addressVisibility]
  );

  const plan = (intent.plan as Plan) ?? 'default';
  const categories = intent.categorySlugs ?? [];
  const maxCategoriesToShow = isBoosted ? 1 : 2;
  const remainingCategoriesCount = categories.length - maxCategoriesToShow;
  const isInactive = isCanceled || isDeleted;

  return (
    <motion.button
      onClick={() => onClick?.(intent.id)}
      className={twMerge(
        'relative w-full rounded-xl overflow-hidden',
        'bg-zinc-900/70 border border-white/5',
        'shadow-[0_4px_16px_-2px_rgba(0,0,0,0.4)]',
        'select-none cursor-pointer text-left',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-indigo-400/30',
        isInactive && 'saturate-0',
        highlightRing.className
      )}
      style={{
        ...highlightRing.style,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      data-plan={plan}
    >
      {/* Cover Image */}
      <div className="relative h-24 overflow-hidden bg-zinc-800">
        {intent.coverKey ? (
          <BlurHashImage
            src={buildIntentCoverUrl(intent.coverKey, 'card')}
            blurhash={intent.coverBlurhash}
            alt={intent.title}
            className="h-full w-full object-cover"
            width={480}
            height={270}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20 flex items-center justify-center">
            <Calendar className="h-10 w-10 text-zinc-400 dark:text-zinc-600 opacity-40" />
          </div>
        )}

        {/* Subtle overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />

        {/* Favourite Button - Top Right */}
        <div
          className="absolute z-20 top-2 right-2"
          onClick={(e) => e.stopPropagation()}
        >
          <FavouriteButton
            intentId={intent.id}
            isFavourite={intent.isFavourite ?? false}
            size="sm"
          />
        </div>

        {(isBoosted || categories.length > 0) && (
          <div className="absolute z-10 top-2 left-2 right-2">
            <div className="flex flex-wrap gap-1">
              {!isInactive && (
                <EventCountdownPill
                  startAt={start}
                  endAt={end}
                  size="xs"
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
                  className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white shadow-sm select-none"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Promowane
                </span>
              )}

              {categories.slice(0, maxCategoriesToShow).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white shadow-sm select-none"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {cat}
                </span>
              ))}

              {remainingCategoriesCount > 0 && (
                <span
                  className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white shadow-sm select-none"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  +{remainingCategoriesCount}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Organizer - Bottom */}
        {intent.owner?.name && (
          <div className="absolute bottom-2 left-2 z-10">
            <Link
              href={`/u/${intent.owner.name}`}
              className="flex items-center gap-1 group"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar
                url={buildAvatarUrl(intent.owner?.avatarKey, 'xs')}
                blurhash={intent.owner?.avatarBlurhash}
                alt={intent.owner.name}
                size={16}
                className="ring-1 ring-white/20 group-hover:ring-white/40 transition-all"
              />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-medium text-white/70 group-hover:text-white/90 transition-colors">
                  {intent.owner.name}
                </span>
                {intent.owner?.verifiedAt && (
                  <VerifiedBadge
                    size="xs"
                    variant="icon"
                    verifiedAt={intent.owner.verifiedAt}
                  />
                )}
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2">
        {/* Title */}
        <h4 className="text-sm font-semibold leading-tight text-white line-clamp-2">
          {intent.title}
        </h4>

        {/* Info Grid */}
        <div className="flex flex-col gap-1 text-[10px] text-zinc-400">
          {locationDisplay && (
            <div className="flex items-center gap-1 min-w-0">
              <locationDisplay.Icon className="h-3 w-3 flex-shrink-0 text-zinc-500" />
              <span className="truncate">{locationDisplay.text}</span>
            </div>
          )}

          <div className="flex items-center gap-1 min-w-0">
            <Calendar className="h-3 w-3 flex-shrink-0 text-zinc-500" />
            <span className="truncate">
              {formatDateRange(startAt, endAt)} • {humanDuration(start, end)}
            </span>
          </div>
          <div className="flex items-center gap-1 truncate">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {formatCapacityLabel(joinedCount, min, max)}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
