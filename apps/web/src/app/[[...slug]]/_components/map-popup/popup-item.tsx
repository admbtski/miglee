/**
 * Individual intent item in map popup
 */

import Link from 'next/link';
import { CapacityBadge } from '@/components/ui/capacity-badge';
import { LevelBadge, sortLevels } from '@/components/ui/level-badge';
import { PlanBadge } from '@/components/ui/plan-badge';
import { Plan, planTheme } from '@/components/ui/plan-theme';
import { planAnimationConfig } from '@/components/ui/plan-animations';
import { SimpleProgressBar } from '@/components/ui/simple-progress-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { computeEventStateAndStatus } from '@/lib/utils/event-status';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { EventCountdownPill } from '@/features/intents/components/event-countdown-pill';
import { Avatar } from '@/components/ui/avatar';
import { Level as GqlLevel } from '@/lib/api/__generated__/react-query-update';
import { formatDateRange } from '@/lib/utils/date';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Calendar, MapPinIcon } from 'lucide-react';
import { useMemo } from 'react';

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
    imageUrl?: string | null;
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
};

export interface PopupItemProps {
  intent: PopupIntent;
  onClick?: (id: string) => void;
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
    withinLock,
    lockReason,
    canJoin,
    joinOpensMinutesBeforeStart,
    joinCutoffMinutesBeforeStart,
    allowJoinLate,
    lateJoinCutoffMinutesAfterStart,
    joinManuallyClosed,
  } = intent;

  const fill = useMemo(
    () =>
      Math.min(
        100,
        Math.round(((joinedCount ?? 0) / Math.max(1, max ?? 1)) * 100)
      ),
    [joinedCount, max]
  );

  const levelsSorted = useMemo(
    () => sortLevels((intent.levels ?? []) as GqlLevel[]),
    [intent.levels]
  );

  // Compute join state and status using shared utility
  const { joinState, status } = useMemo(
    () =>
      computeEventStateAndStatus({
        now: new Date(),
        startAt: new Date(startAt),
        endAt: new Date(endAt),
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
      startAt,
      endAt,
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
  const planStyling = useMemo(() => planTheme(plan), [plan]);

  return (
    <motion.button
      onClick={() => onClick?.(intent.id)}
      whileHover={{
        y: -2,
        scale: 1.01,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        mass: 0.5,
        // BoxShadow animation - synchronized with shimmer (4s cycle)
        boxShadow:
          plan && plan !== 'default'
            ? {
                duration: planAnimationConfig.glowingShadow.duration,
                repeat: Infinity,
                ease: planAnimationConfig.glowingShadow.easing,
                times: [0, 0.25, 0.5, 0.75, 1],
              }
            : undefined,
      }}
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
      className={clsx(
        'relative cursor-pointer group w-full text-left rounded-xl ring-1 px-3 py-2',
        plan === 'default'
          ? 'bg-white dark:bg-zinc-900 ring-zinc-200 dark:ring-zinc-800'
          : clsx(planStyling.bg, planStyling.ring),
        'focus:outline-none focus:ring-2 focus:ring-indigo-400/50 dark:focus:ring-indigo-500/50'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="m-0 text-[15px] font-semibold leading-5 text-zinc-900 dark:text-zinc-100 truncate">
              {intent.title}
            </h4>
            {intent.plan && intent.plan !== 'default' && (
              <PlanBadge plan={intent.plan as Plan} size="xs" variant="icon" />
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{formatDateRange(startAt, endAt)}</span>
          </div>

          {intent.address ? (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{intent.address}</span>
            </div>
          ) : null}
        </div>
      </div>

      {intent.owner?.name ? (
        <div className="mt-2 flex items-center gap-2 min-w-0">
          <Link href={`/u/${intent.owner.name}`} className="flex-shrink-0">
            <Avatar url={intent.owner?.imageUrl} alt="Organizer" size={22} />
          </Link>
          <div className="flex flex-col gap-0.5 min-w-0">
            <Link
              href={`/u/${intent.owner.name}`}
              className="text-[12px] font-medium truncate text-neutral-900 transition-colors hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400"
            >
              <span className="inline-flex items-center gap-1.5 max-w-full">
                <span className="truncate">
                  {(intent.owner as any)?.profile?.displayName ||
                    intent.owner.name}
                </span>
                {intent.owner?.verifiedAt && (
                  <VerifiedBadge
                    size="sm"
                    variant="icon"
                    verifiedAt={intent.owner.verifiedAt}
                  />
                )}
              </span>
            </Link>
            <Link
              href={`/u/${intent.owner.name}`}
              className="text-[11px] text-neutral-500 transition-colors hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 truncate"
            >
              @{intent.owner.name}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-1.5">
        <SimpleProgressBar value={fill} active />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <CapacityBadge
          size="sm"
          statusReason={status.reason}
          joinedCount={intent.joinedCount ?? 0}
          min={intent.min ?? 0}
          max={intent.max ?? 0}
          isFull={isFull}
          canJoin={!!canJoin}
        />
        {status.reason !== 'FULL' && (
          <StatusBadge
            size="sm"
            tone={status.tone}
            reason={status.reason}
            label={status.label}
          />
        )}
        {levelsSorted.map((lv) => (
          <LevelBadge key={lv} level={lv} size="sm" variant="iconText" />
        ))}
      </div>

      {/* Countdown Timer Pill */}
      <div className="mt-2">
        <EventCountdownPill
          startAt={new Date(startAt)}
          endAt={new Date(endAt)}
          joinOpensMinutesBeforeStart={joinOpensMinutesBeforeStart}
          joinCutoffMinutesBeforeStart={joinCutoffMinutesBeforeStart}
          allowJoinLate={allowJoinLate}
          lateJoinCutoffMinutesAfterStart={lateJoinCutoffMinutesAfterStart}
          joinManuallyClosed={joinManuallyClosed}
          isCanceled={isCanceled}
          isDeleted={isDeleted}
        />
      </div>
    </motion.button>
  );
}
