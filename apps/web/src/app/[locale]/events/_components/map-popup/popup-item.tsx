/**
 * Individual intent item in map popup - styled to match EventCard
 */

import { Avatar } from '@/components/ui/avatar';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { FavouriteButton } from '@/components/ui/favourite-button';
import { Plan } from '@/components/ui/plan-theme';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { EventCountdownPill } from '@/features/intents/components/event-countdown-pill';
import {
  AddressVisibility,
  Level as GqlLevel,
} from '@/lib/api/__generated__/react-query-update';
import { buildAvatarUrl, buildIntentCoverUrl } from '@/lib/media/url';
import { formatDateRange, humanDuration, parseISO } from '@/lib/utils/date';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { formatCapacityString } from '@/lib/utils/capacity-formatter';
import { twMerge } from 'tailwind-merge';
import {
  type CardAppearanceConfig,
  getAddressVisibilityMeta,
  getLocationDisplay,
  isBoostActive,
  getAppearanceStyle,
} from '../shared/card-utils';

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
  /** Custom appearance config from IntentAppearance */
  appearance?: {
    card?: CardAppearanceConfig;
  } | null;
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
  locale?: string;
}

export function PopupItem({
  intent,
  onClick,
  locale: localeProp,
}: PopupItemProps) {
  const locale = localeProp || 'en';

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
    appearance,
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

  // Get custom appearance styles from config
  const appearanceStyle = useMemo(
    () => getAppearanceStyle(appearance),
    [appearance]
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
    <motion.div
      className={twMerge(
        'mt-4',
        'relative w-full rounded-xl overflow-hidden',
        'bg-zinc-900/70 border border-white/5',
        'shadow-[0_4px_16px_-2px_rgba(0,0,0,0.4)]',
        'select-none text-left',
        'transition-all duration-200',
        isInactive && 'saturate-0'
      )}
      style={appearanceStyle}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      data-plan={plan}
    >
      {/* Main clickable Link */}
      <Link
        href={`/${locale}/intent/${encodeURIComponent(intent.id)}`}
        className="absolute inset-0 z-[1]"
        aria-label={`Szczegóły wydarzenia: ${intent.title}`}
      />

      {/* Cover Image */}
      <div className="relative h-24 overflow-hidden bg-zinc-800">
        {intent.coverKey ? (
          <BlurHashImage
            src={buildIntentCoverUrl(intent.coverKey, 'card')}
            blurhash={intent.coverBlurhash}
            alt={intent.title}
            className="object-cover w-full h-full brightness-90 contrast-90"
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
          className="absolute z-20 top-2 right-1"
          onClick={(e) => e.stopPropagation()}
        >
          <FavouriteButton
            intentId={intent.id}
            isFavourite={intent.isFavourite ?? false}
            size="xs"
          />
        </div>

        {(isBoosted || categories.length > 0) && (
          <div className="absolute z-10 top-2 left-2 right-9">
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
              href={`/${locale}/u/${intent.owner.name}`}
              className="flex items-center gap-1 group relative z-[2]"
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
        <h4 className="text-[14px] font-semibold leading-tight text-white line-clamp-2">
          {intent.title}
        </h4>

        {/* Info Grid */}
        <div className="flex flex-col gap-0.5 text-[12px] text-zinc-400">
          {locationDisplay && (
            <div className="flex items-center gap-1 min-w-0">
              <locationDisplay.Icon className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
              <span className="truncate">{locationDisplay.text}</span>
            </div>
          )}

          <div className="flex items-center gap-1 min-w-0">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
            <span className="truncate">
              {formatDateRange(startAt, endAt)} • {humanDuration(start, end)}
            </span>
          </div>
          <div className="flex items-center gap-1 truncate">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {formatCapacityString(joinedCount, min, max)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
