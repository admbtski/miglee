'use client';

import { useEffect, useState } from 'react';
import { Clock, DoorOpen, DoorClosed, Play, Flag } from 'lucide-react';
import clsx from 'clsx';

type CountdownPhase =
  | 'BEFORE_OPEN' // Przed otwarciem zapisów
  | 'OPEN_BEFORE_CUTOFF' // Zapisy otwarte, przed cutoffem
  | 'CUTOFF_BEFORE_START' // Po cutoffie, przed startem
  | 'STARTED_LATE_JOIN' // Po starcie, late join dostępny
  | 'STARTED_NO_LATE_JOIN' // Po starcie, late join niedostępny
  | 'ENDED'; // Wydarzenie zakończone

type EventCountdownTimerProps = {
  startAt: Date;
  endAt: Date;
  joinOpensMinutesBeforeStart?: number | null;
  joinCutoffMinutesBeforeStart?: number | null;
  allowJoinLate?: boolean;
  lateJoinCutoffMinutesAfterStart?: number | null;
  joinManuallyClosed?: boolean;
  isCanceled?: boolean;
  isDeleted?: boolean;
};

export function EventCountdownTimer({
  startAt,
  endAt,
  joinOpensMinutesBeforeStart,
  joinCutoffMinutesBeforeStart,
  allowJoinLate,
  lateJoinCutoffMinutesAfterStart,
  joinManuallyClosed,
  isCanceled,
  isDeleted,
}: EventCountdownTimerProps) {
  const [now, setNow] = useState(new Date());

  // Don't show countdown for canceled or deleted events
  if (isCanceled || isDeleted) {
    return null;
  }

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate key timestamps
  const opensAt = joinOpensMinutesBeforeStart
    ? new Date(startAt.getTime() - joinOpensMinutesBeforeStart * 60_000)
    : null;

  const cutoffAt = joinCutoffMinutesBeforeStart
    ? new Date(startAt.getTime() - joinCutoffMinutesBeforeStart * 60_000)
    : null;

  const lateCutoffAt =
    allowJoinLate && lateJoinCutoffMinutesAfterStart
      ? new Date(startAt.getTime() + lateJoinCutoffMinutesAfterStart * 60_000)
      : null;

  // Determine current phase
  const phase: CountdownPhase = (() => {
    if (now >= endAt) return 'ENDED';
    if (now >= startAt) {
      if (allowJoinLate) {
        if (lateCutoffAt && now >= lateCutoffAt) return 'STARTED_NO_LATE_JOIN';
        return 'STARTED_LATE_JOIN';
      }
      return 'STARTED_NO_LATE_JOIN';
    }
    if (cutoffAt && now >= cutoffAt) return 'CUTOFF_BEFORE_START';
    if (opensAt && now < opensAt) return 'BEFORE_OPEN';
    return 'OPEN_BEFORE_CUTOFF';
  })();

  // Calculate target time and label based on phase
  const getCountdownTarget = (): {
    target: Date;
    label: string;
    icon: React.ComponentType<any>;
    color: string;
  } | null => {
    switch (phase) {
      case 'BEFORE_OPEN':
        return opensAt
          ? {
              target: opensAt,
              label: 'Otwarcie zapisów za',
              icon: DoorOpen,
              color: 'blue',
            }
          : null;

      case 'OPEN_BEFORE_CUTOFF':
        if (cutoffAt) {
          return {
            target: cutoffAt,
            label: 'Zamknięcie zapisów za',
            icon: DoorClosed,
            color: 'amber',
          };
        }
        return {
          target: startAt,
          label: 'Start wydarzenia za',
          icon: Play,
          color: 'green',
        };

      case 'CUTOFF_BEFORE_START':
        return {
          target: startAt,
          label: 'Start wydarzenia za',
          icon: Play,
          color: 'green',
        };

      case 'STARTED_LATE_JOIN':
        if (lateCutoffAt) {
          return {
            target: lateCutoffAt,
            label: 'Koniec late join za',
            icon: DoorClosed,
            color: 'amber',
          };
        }
        return {
          target: endAt,
          label: 'Zakończenie za',
          icon: Flag,
          color: 'red',
        };

      case 'STARTED_NO_LATE_JOIN':
        return {
          target: endAt,
          label: 'Zakończenie za',
          icon: Flag,
          color: 'red',
        };

      case 'ENDED':
        return null;
    }
  };

  const countdown = getCountdownTarget();

  if (!countdown || joinManuallyClosed) {
    return null;
  }

  const { target, label, icon: Icon, color } = countdown;
  const msRemaining = target.getTime() - now.getTime();

  if (msRemaining <= 0) {
    return null;
  }

  // Format time remaining
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}min ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const timeString = formatTime(msRemaining);

  // Color classes
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100',
      icon: 'text-blue-600 dark:text-blue-400',
      time: 'text-blue-700 dark:text-blue-300',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      icon: 'text-amber-600 dark:text-amber-400',
      time: 'text-amber-700 dark:text-amber-300',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-900 dark:text-green-100',
      icon: 'text-green-600 dark:text-green-400',
      time: 'text-green-700 dark:text-green-300',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-900 dark:text-red-100',
      icon: 'text-red-600 dark:text-red-400',
      time: 'text-red-700 dark:text-red-300',
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses];

  return (
    <div
      className={clsx(
        'rounded-xl border p-4 transition-all',
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-center gap-3">
        <div className={clsx('flex-shrink-0', colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-medium', colors.text)}>{label}</p>
          <p className={clsx('text-2xl font-bold tabular-nums', colors.time)}>
            {timeString}
          </p>
        </div>
        <div className={clsx('flex-shrink-0', colors.icon)}>
          <Clock className="h-5 w-5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
