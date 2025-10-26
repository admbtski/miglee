'use client';
import {
  Calendar,
  MapPin,
  MapPinHouseIcon,
  Users,
  WifiIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { CategoryPills, TagPills } from '@/components/pill/category-tag-pill';
import { computeJoinState, StatusBadge } from './status-badge';
import { ActionMenu } from './action-menu';
import { capacityLabel, formatDateRange, parseISO } from './formatters';
import { User } from '@/lib/graphql/__generated__/react-query-update';

export function AccountIntentCard(props: {
  id?: string;
  description?: string | null;
  title?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  address?: string | null;
  onlineUrl?: string | null;
  joinedCount: number;
  min: number;
  max: number;
  categories?: string[];
  tags?: string[];
  lockHoursBeforeStart?: number;
  isCanceled?: boolean | null;
  canceledBy?: User | null;
  canceledAt?: string | null;
  cancelReason?: string | null;

  owned?: boolean;
  onPreview?: (id: string) => void | Promise<void>;
  onEdit?: (id: string) => void | Promise<void>;
  onCancel?: (id: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onLeave?: (id: string) => void | Promise<void>;
  onManage?: (id: string) => void | Promise<void>;
}) {
  const {
    id = '',
    title,
    description,
    startAt,
    endAt,
    address,
    onlineUrl,
    joinedCount,
    min,
    max,
    categories,
    tags,
    lockHoursBeforeStart = 0,
    isCanceled,
    canceledBy,
    canceledAt,
    cancelReason,
    owned,
    onPreview,
    onEdit,
    onCancel,
    onDelete,
    onLeave,
    onManage,
  } = props;

  const when = formatDateRange(startAt, endAt);
  const isOnsite = !!address && !onlineUrl;
  const isOnline = !address && !!onlineUrl;
  const isHybrid = !!address && !!onlineUrl;

  const { status, hasStarted, canJoin, isFull, isOngoing, withinLock } =
    useMemo(() => {
      const now = new Date();
      const start = parseISO(startAt) ?? now;
      const end = parseISO(endAt) ?? now;
      return computeJoinState(
        now,
        start,
        end,
        joinedCount,
        max,
        lockHoursBeforeStart,
        isCanceled
      );
    }, [startAt, endAt, joinedCount, max, lockHoursBeforeStart]);

  return (
    <div className="relative min-w-0 flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {/* HEADER */}
      <div className="mb-1 flex flex-wrap items-start justify-between gap-x-2 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Calendar className="h-4 w-4 shrink-0" />
          <span className="truncate" title={when}>
            {when}
          </span>
        </div>
        <StatusBadge
          tone={status.tone}
          reason={status.reason}
          label={status.label}
        />
      </div>

      {/* OPIS */}
      <p
        className="mt-1 line-clamp-3 text-sm text-zinc-900 dark:text-zinc-100"
        title={title ?? ''}
      >
        {title || '—'}
      </p>

      {/* FOOTER */}
      <div className="mt-auto">
        {/* lokalizacja */}
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          {isOnsite && (
            <span
              className="inline-flex min-w-0 items-center gap-1"
              title={address ?? ''}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{address}</span>
            </span>
          )}
          {isOnline && (
            <span className="inline-flex items-center gap-1" title="Online">
              <WifiIcon className="h-3.5 w-3.5 shrink-0" />
              <span>Online</span>
            </span>
          )}
          {isHybrid && (
            <span
              className="inline-flex min-w-0 items-center gap-1"
              title={`${address ?? ''} • Hybrid`}
            >
              <MapPinHouseIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{address}</span>
              <span className="opacity-70 text-nowrap">• Hybrid</span>
            </span>
          )}
        </div>

        {/* pojemność */}
        <div className="mt-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
            <Users className="h-4 w-4" />
            <span>{capacityLabel(joinedCount, min, max)} osób</span>
          </div>
        </div>

        {/* pigułki + menu */}
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <CategoryPills categories={categories ?? []} />
            <TagPills tags={tags ?? []} />
          </div>
          <ActionMenu
            label="Menu akcji intentu"
            onPreview={() => onPreview?.(id)}
            onEdit={() => onEdit?.(id)}
            onCancel={() => onCancel?.(id)}
            onDelete={() => onDelete?.(id)}
            onLeave={() => onLeave?.(id)}
            onManage={() => onManage?.(id)}
            disableDelete={!owned}
            disableCancel={!owned}
            disableEdit={!owned}
            disableLeave={owned}
            disableManage={!owned}
          />
        </div>
      </div>
    </div>
  );
}
