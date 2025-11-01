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

export function computeJoinState({
  hasStarted,
  isFull,
  isOngoing,
  isDeleted,
  isCanceled,
  withinLock,
  startAt,
}: {
  isOngoing?: boolean | null;
  hasStarted?: boolean | null;
  withinLock?: boolean | null;
  isDeleted?: boolean | null;
  isCanceled?: boolean | null;
  isFull?: boolean | null;
  startAt?: Date | null;
}): {
  status: {
    label: string;
    tone: JoinTone;
    reason: JoinReason;
  };
} {
  if (isDeleted)
    return {
      status: {
        label: 'Usunięte',
        tone: 'error',
        reason: 'DELETED',
      },
    };

  if (isCanceled)
    return {
      status: {
        label: 'Odwołane',
        tone: 'warn',
        reason: 'CANCELED',
      },
    };

  if (isOngoing)
    return {
      status: {
        label: 'Trwa teraz',
        tone: 'info',
        reason: 'ONGOING',
      },
    };
  if (hasStarted)
    return {
      status: {
        label: 'Rozpoczęte',
        tone: 'error',
        reason: 'STARTED',
      },
    };
  if (isFull)
    return {
      status: {
        label: 'Brak miejsc',
        tone: 'error',
        reason: 'FULL',
      },
    };
  if (withinLock && startAt) {
    const hrs = Math.max(0, Math.ceil(hoursUntil(startAt)));
    return {
      status: {
        label: `Start za ${hrs} h.`,
        tone: 'warn',
        reason: 'LOCK',
      },
    };
  }
  return {
    status: { label: 'Dostępne', tone: 'ok', reason: 'OK' },
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
