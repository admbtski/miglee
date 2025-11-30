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
  const isPremium = plan !== 'default';
  const categories = intent.categorySlugs ?? [];
  const maxCategoriesToShow = isPremium ? 1 : 2;
  const remainingCategoriesCount = categories.length - maxCategoriesToShow;

  return (
    <motion.button
      onClick={() => onClick?.(intent.id)}
      className={twMerge(
        'relative w-full rounded-2xl overflow-hidden',
        'bg-zinc-900/70 border border-white/5',
        'shadow-[0_6px_24px_-4px_rgba(0,0,0,0.4)]',
        'select-none cursor-pointer text-left',
        'transition-all duration-200',
        getPlanRingClasses(plan, isCanceled, isDeleted),
        'focus:outline-none focus:ring-2 focus:ring-indigo-400/30'
      )}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      data-plan={plan}
    >
      {/* Cover Image */}
      <div className="relative h-32 overflow-hidden bg-zinc-800">
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
          <div className="h-full w-full bg-gradient-to-br from-indigo-900/30 to-violet-900/30" />
        )}

        {/* Subtle overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />

        {/* Badges - Top */}
        {(isPremium || categories.length > 0) && (
          <div className="absolute top-3 left-3 right-3 z-10">
            <div className="flex flex-wrap gap-1.5">
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

              {isPremium && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-600/20 text-violet-300 border border-violet-600/30 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                  <Sparkles className="w-3 h-3" />
                  Promowane
                </span>
              )}

              {categories.slice(0, maxCategoriesToShow).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center rounded-full bg-white/10 border border-white/5 px-2 py-0.5 text-xs font-medium text-white/90"
                >
                  {cat}
                </span>
              ))}

              {remainingCategoriesCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-white/10 border border-white/5 px-2 py-0.5 text-xs font-medium text-white/90">
                  +{remainingCategoriesCount}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Organizer - Bottom */}
        {intent.owner?.name && (
          <div className="absolute bottom-3 left-3 z-10">
            <Link
              href={`/u/${intent.owner.name}`}
              className="flex items-center gap-1.5 group"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar
                url={buildAvatarUrl(intent.owner?.avatarKey, 'xs')}
                blurhash={intent.owner?.avatarBlurhash}
                alt={intent.owner.name}
                size={20}
                className="ring-1 ring-white/20 group-hover:ring-white/40 transition-all"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-white/70 group-hover:text-white/90 transition-colors">
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
      <div className="p-4 flex flex-col gap-3">
        {/* Title */}
        <h4 className="text-base font-semibold leading-snug text-white line-clamp-2">
          {intent.title}
        </h4>

        {/* Info Grid */}
        <div className="flex flex-col gap-2 text-xs text-zinc-400">
          {intent.address && (
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
              <span className="truncate">{intent.address}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
            <span className="truncate">
              {formatDateRange(startAt, endAt)} • {humanDuration(start, end)}
            </span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <CapacityBadge
            size="xs"
            statusReason={status.reason}
            joinedCount={intent.joinedCount ?? 0}
            min={intent.min ?? 0}
            max={intent.max ?? 0}
            isFull={isFull}
            canJoin={Boolean(intent.canJoin)}
          />
          {status.reason !== 'FULL' && status.reason !== 'OK' && (
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
