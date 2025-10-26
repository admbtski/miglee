'use client';
import { Lock } from 'lucide-react';

export const hoursUntil = (date: Date) =>
  (date.getTime() - Date.now()) / 3_600_000;

export type JoinTone = 'ok' | 'warn' | 'error' | 'info';
export type JoinReason =
  | 'OK'
  | 'LOCK'
  | 'FULL'
  | 'STARTED'
  | 'ONGOING'
  | 'DELETED'
  | 'CANCELED';

export function computeJoinState(
  now: Date,
  start: Date,
  end: Date,
  joinedCount: number,
  max: number,
  lockHrs = 0,
  isCanceled?: boolean | null,
  isDeleted?: boolean | null
): {
  canJoin: boolean;
  status: {
    label: string;
    tone: JoinTone;
    reason: JoinReason;
  };
  isOngoing: boolean;
  hasStarted: boolean;
  isFull: boolean;
  withinLock: boolean;
} {
  const hasStarted = now >= start;
  const isOngoing = now >= start && now <= end;
  const isFull = max > 0 && joinedCount >= max;
  const withinLock = !hasStarted && hoursUntil(start) <= lockHrs;
  const canJoin = !isFull && !hasStarted && !withinLock && !isCanceled;

  if (isDeleted)
    return {
      canJoin,
      status: {
        label: 'Usunięte',
        tone: 'error',
        reason: 'DELETED',
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };

  if (isCanceled)
    return {
      canJoin,
      status: {
        label: 'Odwołane',
        tone: 'warn',
        reason: 'CANCELED',
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };

  if (isOngoing)
    return {
      canJoin,
      status: {
        label: 'Trwa teraz',
        tone: 'info',
        reason: 'ONGOING',
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  if (hasStarted)
    return {
      canJoin,
      status: {
        label: 'Rozpoczęte',
        tone: 'error',
        reason: 'STARTED',
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  if (isFull)
    return {
      canJoin,
      status: {
        label: 'Brak miejsc',
        tone: 'error',
        reason: 'FULL',
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  if (withinLock) {
    const hrs = Math.max(0, Math.ceil(hoursUntil(start)));
    return {
      canJoin,
      status: {
        label: `Start za ${hrs} h.`,
        tone: 'warn',
        reason: 'LOCK',
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  }
  return {
    canJoin,
    status: { label: 'Dostępne', tone: 'ok', reason: 'OK' },
    isOngoing,
    hasStarted,
    isFull,
    withinLock,
  };
}

function toneClasses(tone: JoinTone) {
  switch (tone) {
    case 'ok':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800/50';
    case 'warn':
      return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800/50';
    case 'error':
      return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-800/50';
    default:
      return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:ring-sky-800/50';
  }
}

export function StatusBadge({
  tone,
  reason,
  label,
}: {
  tone: JoinTone;
  reason?: JoinReason;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] leading-tight md:px-2 md:py-1 md:text-xs ${toneClasses(tone)}`}
      aria-live="polite"
    >
      {(reason === 'LOCK' || reason === 'STARTED') && (
        <Lock className="h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </span>
  );
}
