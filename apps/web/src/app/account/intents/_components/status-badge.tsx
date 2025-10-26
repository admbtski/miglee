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
  | 'CANCELED';

export function computeJoinState(
  now: Date,
  start: Date,
  end: Date,
  joinedCount: number,
  max: number,
  lockHrs = 0,
  isCanceled: boolean
) {
  const hasStarted = now >= start;
  const isOngoing = now >= start && now <= end;
  const isFull = max > 0 && joinedCount >= max;
  const withinLock = !hasStarted && hoursUntil(start) <= lockHrs;
  const canJoin = !isFull && !hasStarted && !withinLock && !isCanceled;

  if (isCanceled)
    return {
      canJoin,
      status: {
        label: 'Odwołane',
        tone: 'warn' as const,
        reason: 'CANCELED' as const,
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
        tone: 'info' as const,
        reason: 'ONGOING' as const,
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
        tone: 'info' as const,
        reason: 'ONGOING' as const,
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
        tone: 'error' as const,
        reason: 'STARTED' as const,
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
        tone: 'error' as const,
        reason: 'FULL' as const,
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
        tone: 'warn' as const,
        reason: 'LOCK' as const,
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  }
  return {
    canJoin,
    status: { label: 'Dostępne', tone: 'ok' as const, reason: 'OK' as const },
    isOngoing,
    hasStarted,
    isFull,
    withinLock,
  };
}

const toneClass = (tone: JoinTone) =>
  tone === 'error'
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    : tone === 'warn'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      : tone === 'info'
        ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';

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
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] leading-tight md:px-2 md:py-1 md:text-xs ${toneClass(tone)}`}
      aria-live="polite"
    >
      {(reason === 'LOCK' || reason === 'STARTED') && (
        <Lock className="h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </span>
  );
}
