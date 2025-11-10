/**
 * Individual intent item in map popup
 */

import { CapacityBadge } from '@/components/ui/capacity-badge';
import { LevelBadge, sortLevels } from '@/components/ui/level-badge';
import { PlanBadge } from '@/components/ui/plan-badge';
import { Plan } from '@/components/ui/plan-theme';
import { SimpleProgressBar } from '@/components/ui/simple-progress-bar';
import { computeJoinState, StatusBadge } from '@/components/ui/status-badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { Avatar } from '@/components/ui/avatar';
import { Level as GqlLevel } from '@/lib/api/__generated__/react-query-update';
import { formatDateRange } from '@/lib/utils/date';
import clsx from 'clsx';
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
  canJoin?: boolean | null;
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
    withinLock,
    canJoin,
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

  const { status } = useMemo(
    () =>
      computeJoinState({
        startAt: new Date(startAt),
        isCanceled,
        isDeleted,
        isFull,
        isOngoing,
        hasStarted,
        withinLock,
      }),
    [startAt, hasStarted, isCanceled, isDeleted, isFull, isOngoing, withinLock]
  );

  return (
    <button
      onClick={() => onClick?.(intent.id)}
      className={clsx(
        'cursor-pointer group w-full text-left rounded-xl ring-1 px-3 py-2 transition-all',
        'bg-white dark:bg-zinc-900',
        'ring-zinc-200 dark:ring-zinc-800',
        'hover:shadow-sm hover:-translate-y-[1px]',
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
          <Avatar url={intent.owner?.imageUrl} alt="Organizer" size={22} />
          <p className="text-[12px] truncate text-neutral-900 dark:text-neutral-100">
            <span className="inline-flex items-center gap-1.5 max-w-full">
              <span className="truncate">{intent.owner?.name}</span>
              {intent.owner?.verifiedAt && (
                <VerifiedBadge
                  size="sm"
                  variant="icon"
                  verifiedAt={intent.owner.verifiedAt}
                />
              )}
            </span>
          </p>
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
    </button>
  );
}
