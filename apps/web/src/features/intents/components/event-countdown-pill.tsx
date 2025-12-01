'use client';

import clsx from 'clsx';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

/* ───────────────────────────── Types ───────────────────────────── */

export type CountdownPillSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type CountdownPillVariant = 'icon' | 'iconText' | 'text';

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
  size?: CountdownPillSize;
  variant?: CountdownPillVariant;
  className?: string;
  title?: string;
};

/* ───────────────────────────── Sizing ───────────────────────────── */

const SIZE_STYLES: Record<
  CountdownPillSize,
  { container: string; icon: string; text: string; gap: string }
> = {
  xs: {
    container: 'px-1.5 py-0.5 rounded-full',
    icon: 'w-3 h-3',
    text: 'text-[10px] leading-none',
    gap: 'gap-1',
  },
  sm: {
    container: 'px-2 py-0.5 rounded-full',
    icon: 'w-3.5 h-3.5',
    text: 'text-[11px] leading-none',
    gap: 'gap-1',
  },
  md: {
    container: 'px-2.5 py-0.5 rounded-full',
    icon: 'w-3.5 h-3.5',
    text: 'text-xs leading-none',
    gap: 'gap-1.5',
  },
  lg: {
    container: 'px-3 py-0.5 rounded-full',
    icon: 'w-4 h-4',
    text: 'text-sm leading-none',
    gap: 'gap-1.5',
  },
  xl: {
    container: 'px-3.5 py-1 rounded-full',
    icon: 'w-4 h-4',
    text: 'text-base leading-none',
    gap: 'gap-2',
  },
};

/* ───────────────────────────── Component ───────────────────────────── */

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
  size = 'md',
  variant = 'iconText',
  className,
  title: customTitle,
}: EventCountdownPillProps) {
  const [now, setNow] = useState(new Date());
  const S = SIZE_STYLES[size];

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
    color: 'blue' | 'amber' | 'green' | 'red';
  } | null => {
    switch (phase) {
      case 'BEFORE_OPEN':
        return opensAt
          ? {
              target: opensAt,
              label: 'Otwarcie za',
              color: 'blue',
            }
          : null;

      case 'OPEN_BEFORE_CUTOFF':
        if (cutoffAt) {
          return {
            target: cutoffAt,
            label: 'Zamknięcie za',
            color: 'amber',
          };
        }
        return {
          target: startAt,
          label: 'Start za',
          color: 'green',
        };

      case 'CUTOFF_BEFORE_START':
        return {
          target: startAt,
          label: 'Start za',
          color: 'green',
        };

      case 'STARTED_LATE_JOIN':
        if (lateCutoffAt) {
          return {
            target: lateCutoffAt,
            label: 'Late join za',
            color: 'amber',
          };
        }
        return {
          target: endAt,
          label: 'Koniec za',
          color: 'red',
        };

      case 'STARTED_NO_LATE_JOIN':
        return {
          target: endAt,
          label: 'Koniec za',
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

  const { target, label: countdownLabel, color } = countdown;
  const msRemaining = target.getTime() - now.getTime();

  if (msRemaining <= 0) {
    return null;
  }

  const timeString = formatTime(msRemaining);
  const fullLabel = `${countdownLabel} ${timeString}`;
  const toneClass = getToneClass(color);
  const aria = `${countdownLabel} ${timeString}`;

  // Variant: text only
  if (variant === 'text') {
    return (
      <span
        className={twMerge(
          'inline-flex items-center select-none',
          S.text,
          className
        )}
        title={customTitle ?? aria}
        aria-label={aria}
      >
        {fullLabel}
      </span>
    );
  }

  // Variant: icon only
  if (variant === 'icon') {
    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center rounded-full ring-1 shadow-sm select-none',
          'bg-white/80 dark:bg-zinc-900/60',
          toneClass,
          S.container,
          className
        )}
        title={customTitle ?? aria}
        aria-label={aria}
      >
        <Clock className={clsx(S.icon, 'shrink-0 align-middle')} aria-hidden />
      </span>
    );
  }

  // Default: icon + text
  return (
    <span
      className={twMerge(
        'inline-flex items-center rounded-full ring-1 shadow-sm select-none',
        'bg-white/80 dark:bg-zinc-900/60',
        toneClass,
        S.container,
        S.gap,
        className
      )}
      title={customTitle ?? aria}
      aria-label={aria}
    >
      <Clock className={clsx(S.icon, 'shrink-0 align-middle')} aria-hidden />
      <span className={clsx('font-medium truncate', S.text)}>{fullLabel}</span>
    </span>
  );
}

/* ───────────────────────────── Utils ───────────────────────────── */

// Format time remaining (compact version for pill)
function formatTime(ms: number): string {
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
}

function getToneClass(color: 'blue' | 'amber' | 'green' | 'red'): string {
  switch (color) {
    case 'blue':
      return 'text-blue-700 dark:text-blue-300 ring-blue-200 dark:ring-blue-800/50';
    case 'amber':
      return 'text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-800/50';
    case 'green':
      return 'text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800/50';
    case 'red':
      return 'text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-800/50';
  }
}
