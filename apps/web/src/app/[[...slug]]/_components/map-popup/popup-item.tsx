/**
 * Individual intent item in map popup - styled to match EventCard
 */

import { Avatar } from '@/components/ui/avatar';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { CapacityBadge } from '@/components/ui/capacity-badge';
import { Plan } from '@/components/ui/plan-theme';
import { StatusBadge } from '@/components/ui/status-badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { EventCountdownPill } from '@/features/intents/components/event-countdown-pill';
import { Level as GqlLevel } from '@/lib/api/__generated__/react-query-update';
import { buildAvatarUrl, buildIntentCoverUrl } from '@/lib/media/url';
import { formatDateRange, humanDuration, parseISO } from '@/lib/utils/date';
import { computeEventStateAndStatus } from '@/lib/utils/event-status';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

export type PopupIntent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  address?: string | null;
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
  meetingKind?: 'ONSITE' | 'ONLINE' | 'HYBRID' | null;
  categorySlugs?: string[] | null;
  coverKey?: string | null;
  coverBlurhash?: string | null;
};

export interface PopupItemProps {
  intent: PopupIntent;
  onClick?: (id: string) => void;
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

export function PopupItem({ intent, onClick }: PopupItemProps) {
  const {
    startAt,
    endAt,
    isCanceled,
    isDeleted,
    isFull,
    isOngoing,
    hasStarted,
    joinedCount,
    max,
    min,
    joinOpensMinutesBeforeStart,
    joinCutoffMinutesBeforeStart,
    allowJoinLate,
    lateJoinCutoffMinutesAfterStart,
    joinManuallyClosed,
  } = intent;

  const start = useMemo(() => parseISO(startAt), [startAt]);
  const end = useMemo(() => parseISO(endAt), [endAt]);

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
        min: min ?? 2,
        max: max ?? 2,
        joinedCount: joinedCount ?? 0,
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

  const plan = (intent.plan as Plan) ?? 'default';
  const isInactive = isCanceled || isDeleted;
  const isPremium = plan !== 'default';
  const categories = intent.categorySlugs ?? [];
  const maxCategoriesToShow = isPremium ? 1 : 2;
  const remainingCategoriesCount = categories.length - maxCategoriesToShow;

  return (
    <motion.button
      onClick={() => onClick?.(intent.id)}
      whileHover={{
        y: isInactive ? 0 : -2,
        scale: isInactive ? 1 : 1.01,
      }}
      className={twMerge(
        'my-2',
        'relative w-full rounded-xl p-3 flex flex-col gap-2',
        'ring-1 ring-white/5 dark:ring-white/5',
        'bg-white dark:bg-neutral-900',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        'select-none cursor-pointer text-left',
        isInactive && 'saturate-0',
        getPlanRingClasses(plan, isCanceled, isDeleted),
        'focus:outline-none focus:ring-2 focus:ring-indigo-400/50 dark:focus:ring-indigo-500/50'
      )}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      data-plan={plan}
    >
      {/* Cover Image */}
      <div className="relative -mx-3 -mt-3 h-32 overflow-hidden rounded-t-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
        {intent.coverKey ? (
          <BlurHashImage
            src={buildIntentCoverUrl(intent.coverKey, 'card')}
            blurhash={intent.coverBlurhash}
            alt={intent.title}
            className="h-full w-full object-cover brightness-90 contrast-90"
            width={480}
            height={270}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/0 to-black/40" />

        {/* Inactive Overlay */}
        {isInactive && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <p className="text-white font-semibold text-sm">
                {isDeleted ? 'Usunięte' : 'Odwołane'}
              </p>
              <p className="text-white/60 text-xs mt-0.5">
                {isDeleted
                  ? 'To wydarzenie zostało usunięte'
                  : 'To wydarzenie zostało odwołane'}
              </p>
            </div>
          </div>
        )}

        {/* Badges - Top Left */}
        {(isPremium || categories.length > 0) && (
          <div className="absolute top-2 left-2 right-2 z-10">
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

              {isPremium && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white shadow-lg"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Promowane
                </span>
              )}

              {categories.slice(0, maxCategoriesToShow).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white shadow-lg"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {cat}
                </span>
              ))}

              {remainingCategoriesCount > 0 && (
                <span
                  className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white shadow-lg"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  +{remainingCategoriesCount}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Organizer - Bottom Left */}
        {intent.owner?.name && (
          <div className="absolute bottom-2 left-2 z-10">
            <Link
              href={`/u/${intent.owner.name}`}
              className="flex items-center gap-1 group relative z-[2]"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar
                url={buildAvatarUrl(intent.owner?.avatarKey, 'xs')}
                blurhash={intent.owner?.avatarBlurhash}
                alt={intent.owner.name}
                size={20}
                className="opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="flex items-center gap-1">
                <span
                  className="text-[10px] font-normal text-white/80 leading-tight truncate group-hover:text-white transition-colors"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {intent.owner.name}
                </span>
                {intent.owner?.verifiedAt && (
                  <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                    <VerifiedBadge
                      size="xs"
                      variant="icon"
                      verifiedAt={intent.owner.verifiedAt}
                    />
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-semibold leading-tight text-neutral-900 dark:text-white line-clamp-2">
          {intent.title}
        </h4>

        <div className="flex flex-col gap-0.5 text-xs text-neutral-600 dark:text-neutral-400">
          {intent.address && (
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs truncate">{intent.address}</span>
            </div>
          )}

          <div className="flex items-center gap-1 truncate">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span className="text-xs truncate">
              {formatDateRange(startAt, endAt)} • {humanDuration(start, end)}
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <CapacityBadge
            size="xs"
            statusReason={status.reason}
            joinedCount={intent.joinedCount ?? 0}
            min={intent.min ?? 0}
            max={intent.max ?? 0}
            isFull={isFull}
            canJoin={Boolean(intent.canJoin)}
          />
          {!isInactive &&
            status.reason !== 'FULL' &&
            status.reason !== 'OK' && (
              <StatusBadge
                size="xs"
                tone={status.tone}
                reason={status.reason}
                label={status.label}
              />
            )}
        </div>
      </div>
    </motion.button>
  );
}
