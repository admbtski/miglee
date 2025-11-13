'use client';

import { useEffect, useState } from 'react';
import { Clock, DoorOpen, DoorClosed, Play, Flag } from 'lucide-react';
import clsx from 'clsx';

type CountdownPhase =
  | 'BEFORE_OPEN'
  | 'OPEN_BEFORE_CUTOFF'
  | 'CUTOFF_BEFORE_START'
  | 'STARTED_LATE_JOIN'
  | 'STARTED_NO_LATE_JOIN'
  | 'ENDED';

type EventCountdownPillProps = {
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

export function EventCountdownPill({
  startAt,
  endAt,
  joinOpensMinutesBeforeStart,
  joinCutoffMinutesBeforeStart,
  allowJoinLate,
  lateJoinCutoffMinutesAfterStart,
  joinManuallyClosed,
  isCanceled,
  isDeleted,
}: EventCountdownPillProps) {
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
    color: 'blue' | 'amber' | 'green' | 'red';
  } | null => {
    switch (phase) {
      case 'BEFORE_OPEN':
        return opensAt
          ? {
              target: opensAt,
              label: 'Otwarcie za',
              icon: DoorOpen,
              color: 'blue',
            }
          : null;

      case 'OPEN_BEFORE_CUTOFF':
        if (cutoffAt) {
          return {
            target: cutoffAt,
            label: 'Zamknięcie za',
            icon: DoorClosed,
            color: 'amber',
          };
        }
        return {
          target: startAt,
          label: 'Start za',
          icon: Play,
          color: 'green',
        };

      case 'CUTOFF_BEFORE_START':
        return {
          target: startAt,
          label: 'Start za',
          icon: Play,
          color: 'green',
        };

      case 'STARTED_LATE_JOIN':
        if (lateCutoffAt) {
          return {
            target: lateCutoffAt,
            label: 'Late join za',
            icon: DoorClosed,
            color: 'amber',
          };
        }
        return {
          target: endAt,
          label: 'Koniec za',
          icon: Flag,
          color: 'red',
        };

      case 'STARTED_NO_LATE_JOIN':
        return {
          target: endAt,
          label: 'Koniec za',
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

  // Format time remaining (compact version for pill)
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    }
    return `${seconds}s`;
  };

  const timeString = formatTime(msRemaining);

  // Color classes for pill
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-800 dark:text-blue-200',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/40',
      text: 'text-amber-800 dark:text-amber-200',
      icon: 'text-amber-600 dark:text-amber-400',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/40',
      text: 'text-green-800 dark:text-green-200',
      icon: 'text-green-600 dark:text-green-400',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/40',
      text: 'text-red-800 dark:text-red-200',
      icon: 'text-red-600 dark:text-red-400',
    },
  };

  const colors = colorClasses[color];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-all',
        colors.bg,
        colors.text
      )}
      title={`${label} ${timeString}`}
    >
      <Icon className={clsx('h-3.5 w-3.5', colors.icon)} />
      <span className="whitespace-nowrap">
        {label} <span className="tabular-nums font-semibold">{timeString}</span>
      </span>
      <Clock className={clsx('h-3 w-3 animate-pulse', colors.icon)} />
    </span>
  );
}
