'use client';

import { JoinLockReason } from '@/lib/api/__generated__/react-query-update';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Info, Lock, XCircle } from 'lucide-react';

/* ───────────────────────────── Types ───────────────────────────── */

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
  | 'CANCELED'
  | 'INVITE_ONLY'
  | 'NOT_OPEN_YET'
  | 'CUTOFF'
  | 'NO_LATE_JOIN'
  | 'LATE_CUTOFF'
  | 'MANUAL'
  | 'ENDED';

// GraphQL JoinLockReason enum

// Map lockReason to user-friendly labels
function getLockReasonLabel(
  lockReason: JoinLockReason | null | undefined,
  startAt?: Date | null
): string {
  if (!lockReason) return 'Niedostępne';

  switch (lockReason) {
    case 'FULL':
      return 'Brak miejsc';
    case 'INVITE_ONLY':
      return 'Tylko zaproszenia';
    case 'NOT_OPEN_YET':
      if (startAt) {
        const hrs = Math.max(0, Math.ceil(hoursUntil(startAt)));
        return `Otwarte za ${hrs} h.`;
      }
      return 'Jeszcze zamknięte';
    case 'CUTOFF':
      return 'Termin minął';
    case 'NO_LATE_JOIN':
      return 'Brak spóźnialskich';
    case 'LATE_CUTOFF':
      return 'Za późno';
    case 'MANUAL':
      return 'Zamknięte';
    case 'ENDED':
      return 'Zakończone';
    case 'CANCELED':
      return 'Odwołane';
    case 'DELETED':
      return 'Usunięte';
    case 'OTHER':
    default:
      return 'Niedostępne';
  }
}

// Map lockReason to tone
function getLockReasonTone(
  lockReason: JoinLockReason | null | undefined
): JoinTone {
  if (!lockReason) return 'warn';

  switch (lockReason) {
    case 'FULL':
    case 'ENDED':
    case 'DELETED':
      return 'error';
    case 'CANCELED':
    case 'NOT_OPEN_YET':
    case 'CUTOFF':
    case 'NO_LATE_JOIN':
    case 'LATE_CUTOFF':
    case 'MANUAL':
      return 'warn';
    case 'INVITE_ONLY':
      return 'info';
    case 'OTHER':
    default:
      return 'warn';
  }
}

export function computeJoinState({
  hasStarted,
  isFull,
  isOngoing,
  isDeleted,
  isCanceled,
  withinLock,
  lockReason,
  startAt,
}: {
  isOngoing?: boolean | null;
  hasStarted?: boolean | null;
  withinLock?: boolean | null;
  isDeleted?: boolean | null;
  isCanceled?: boolean | null;
  isFull?: boolean | null;
  lockReason?: JoinLockReason | null;
  startAt?: Date | null;
}): {
  status: {
    label: string;
    tone: JoinTone;
    reason: JoinReason;
  };
} {
  // Priority 1: Deleted
  if (isDeleted)
    return { status: { label: 'Usunięte', tone: 'error', reason: 'DELETED' } };

  // Priority 2: Canceled
  if (isCanceled)
    return { status: { label: 'Odwołane', tone: 'warn', reason: 'CANCELED' } };

  // Priority 3: Ongoing
  if (isOngoing)
    return { status: { label: 'Trwa teraz', tone: 'info', reason: 'ONGOING' } };

  // Priority 4: Started (but not ongoing)
  if (hasStarted)
    return {
      status: { label: 'Rozpoczęte', tone: 'error', reason: 'STARTED' },
    };

  // Priority 5: Use lockReason if available (more specific)
  if (lockReason) {
    const label = getLockReasonLabel(lockReason, startAt);
    const tone = getLockReasonTone(lockReason);
    const reason = lockReason as JoinReason;
    return { status: { label, tone, reason } };
  }

  // Priority 6: Full (fallback if no lockReason)
  if (isFull)
    return { status: { label: 'Brak miejsc', tone: 'error', reason: 'FULL' } };

  // Priority 7: Within lock (generic)
  if (withinLock && startAt) {
    const hrs = Math.max(0, Math.ceil(hoursUntil(startAt)));
    return {
      status: { label: `Start za ${hrs} h.`, tone: 'warn', reason: 'LOCK' },
    };
  }

  // Default: Available
  return { status: { label: 'Dostępne', tone: 'ok', reason: 'OK' } };
}

/* ───────────────────────────── Sizing ───────────────────────────── */

export type StatusBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type StatusBadgeVariant = 'icon' | 'iconText' | 'text';

const SIZE_STYLES: Record<
  StatusBadgeSize,
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

export function StatusBadge({
  tone,
  reason,
  label,
  size = 'md',
  variant = 'iconText',
  className,
  title,
  icon,
}: {
  tone: JoinTone;
  reason?: JoinReason;
  label?: string;
  size?: StatusBadgeSize;
  variant?: StatusBadgeVariant;
  className?: string;
  title?: string;
  /** Nadpisuje ikonę (np. własna z lucide). */
  icon?: React.ReactNode;
}) {
  const S = SIZE_STYLES[size];
  const toneClass = getToneClass(tone);
  const aria = label ?? 'Status';

  // Determine icon
  const IconComponent = getIconComponent(tone, reason);
  const IconNode = icon ?? (
    <IconComponent
      className={clsx(S.icon, 'shrink-0 align-middle')}
      aria-hidden
    />
  );

  // Variant: text only
  if (variant === 'text') {
    return (
      <span
        className={clsx(
          'inline-flex items-center select-none',
          S.text,
          className
        )}
        title={title ?? aria}
        aria-label={aria}
        aria-live="polite"
      >
        {label}
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
        title={title ?? aria}
        aria-label={aria}
        aria-live="polite"
      >
        {IconNode}
      </span>
    );
  }

  // Default: icon + text
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full ring-1 shadow-sm select-none',
        'bg-white/80 dark:bg-zinc-900/60',
        toneClass,
        S.container,
        S.gap,
        className
      )}
      title={title ?? aria}
      aria-label={aria}
      aria-live="polite"
    >
      {IconNode}
      {label && <span className={clsx('truncate', S.text)}>{label}</span>}
    </span>
  );
}

/* ───────────────────────────── Utils ───────────────────────────── */

function getToneClass(tone: JoinTone): string {
  switch (tone) {
    case 'ok':
      return 'text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-800/50';
    case 'warn':
      return 'text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-800/50';
    case 'error':
      return 'text-rose-700 dark:text-rose-400 ring-rose-200 dark:ring-rose-800/50';
    case 'info':
      return 'text-sky-700 dark:text-sky-400 ring-sky-200 dark:ring-sky-800/50';
  }
}

function getIconComponent(
  tone: JoinTone,
  reason?: JoinReason
): React.ComponentType<any> {
  // Special cases: LOCK/STARTED use Lock icon
  if (reason === 'LOCK' || reason === 'STARTED') {
    return Lock;
  }

  // Default icons based on tone
  switch (tone) {
    case 'ok':
      return CheckCircle2;
    case 'warn':
      return AlertTriangle;
    case 'error':
      return XCircle;
    case 'info':
    default:
      return Info;
  }
}
