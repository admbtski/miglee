'use client';

import { JoinLockReason } from '@/lib/api/__generated__/react-query-update';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Info, Lock, XCircle } from 'lucide-react';

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
  lockReason: LockReason | null | undefined
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
  lockReason?: LockReason | null;
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

/* ───────────────────────────── Sizing & theme ───────────────────────────── */

type StatusBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type StatusBadgeVariant = 'icon' | 'iconText';

const SIZE_STYLES: Record<
  StatusBadgeSize,
  { container: string; icon: string; text: string; gap: string }
> = {
  xs: {
    container: 'px-1 py-0.5 rounded-full',
    icon: 'w-3.5 h-3.5 opacity-80 mr-[3px]',
    text: 'text-[10px] leading-none',
    gap: 'gap-0',
  },
  sm: {
    container: 'px-1.5 py-0.5 rounded-full',
    icon: 'w-3.5 h-3.5 opacity-80 mr-[3px]',
    text: 'text-[11px] leading-none',
    gap: 'gap-0',
  },
  md: {
    container: 'px-2 py-0.5 rounded-full',
    icon: 'w-3.5 h-3.5 opacity-80 mr-[3px]',
    text: 'text-xs leading-none',
    gap: 'gap-0',
  },
  lg: {
    container: 'px-2.5 py-0.5 rounded-full',
    icon: 'w-3.5 h-3.5 opacity-80 mr-[3px]',
    text: 'text-sm leading-none',
    gap: 'gap-0',
  },
  xl: {
    container: 'px-3 py-1 rounded-full',
    icon: 'w-3.5 h-3.5 opacity-80 mr-[3px]',
    text: 'text-base leading-none',
    gap: 'gap-0',
  },
};

function toneClasses(tone: JoinTone) {
  switch (tone) {
    case 'ok':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:ring-emerald-800/50';
    case 'warn':
      return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:ring-amber-800/50';
    case 'error':
      return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:ring-rose-800/50';
    default:
      return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-200 dark:ring-sky-800/50';
  }
}

function defaultIconFor(tone: JoinTone) {
  switch (tone) {
    case 'ok':
      return CheckCircle2;
    case 'warn':
      return AlertTriangle;
    case 'error':
      return XCircle;
    default:
      return Info;
  }
}

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
  label?: string; // optional in 'icon' wariancie
  size?: StatusBadgeSize;
  variant?: StatusBadgeVariant;
  className?: string;
  title?: string;
  /** Nadpisuje ikonę (np. własna z lucide). */
  icon?: React.ReactNode;
}) {
  const S = SIZE_STYLES[size];

  // Ikona: LOCK/STARTED mają priorytet na kłódkę
  const IconNode =
    icon ??
    (reason === 'LOCK' || reason === 'STARTED' ? (
      <Lock className={clsx(S.icon)} aria-hidden />
    ) : (
      (() => {
        const I = defaultIconFor(tone);
        return <I className={clsx(S.icon)} aria-hidden />;
      })()
    ));

  if (variant === 'icon') {
    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center rounded-full ring-1 shadow-sm select-none',
          toneClasses(tone),
          S.container,
          className
        )}
        title={title ?? label}
        aria-live="polite"
      >
        {IconNode}
      </span>
    );
  }

  // domyślny: ikona + tekst
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full ring-1 shadow-sm select-none',
        toneClasses(tone),
        S.container,
        S.gap,
        className
      )}
      title={title ?? label}
      aria-live="polite"
    >
      {IconNode}
      {label && <span className={S.text}>{label}</span>}
    </span>
  );
}
