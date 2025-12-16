'use client';

import clsx from 'clsx';
import { Users } from 'lucide-react';

/* ───────────────────────────── Typy ───────────────────────────── */

export type CapacityBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type CapacityBadgeVariant = 'icon' | 'iconText' | 'text';

export function CapacityBadge({
  joinedCount,
  min,
  max,
  isFull,
  canJoin,
  statusReason,
  size = 'md',
  variant = 'iconText',
  className,
  title,
}: {
  joinedCount: number;
  min: number;
  max: number;
  isFull: boolean;
  canJoin: boolean;
  statusReason: string;
  size?: CapacityBadgeSize;
  variant?: CapacityBadgeVariant;
  className?: string;
  title?: string;
}) {
  const S = SIZE_STYLES[size];

  const spotsLeft = Math.max(0, max - joinedCount);
  const fillPct = Math.min(
    100,
    Math.round((joinedCount / Math.max(1, max)) * 100)
  );

  const toneClass =
    isFull || statusReason === 'FULL'
      ? 'text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-800/50'
      : canJoin
        ? fillPct >= 80
          ? 'text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-800/50'
          : 'text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800/50'
        : 'text-zinc-700 dark:text-zinc-300 ring-zinc-200 dark:ring-zinc-700';

  const label =
    isFull || statusReason === 'FULL'
      ? `Brak miejsc • ${joinedCount} / ${min}-${max}`
      : canJoin
        ? `${joinedCount} / ${max} • ${spotsLeft} ${plural(spotsLeft, ['wolne', 'wolne', 'wolnych'])}`
        : `${joinedCount} / ${max}`;

  const aria =
    isFull || statusReason === 'FULL'
      ? `Brak miejsc. Zajętość ${joinedCount} w zakresie ${min}-${max}.`
      : `Zajętość ${joinedCount} z ${max}. ${spotsLeft} ${plural(spotsLeft, ['miejsce', 'miejsca', 'miejsc'])} wolne.`;

  // Wariant: tylko tekst (przydatne w super ciasnych miejscach)
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
      >
        {label}
      </span>
    );
  }

  // Wariant: tylko ikona
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
      >
        <Users className={clsx(S.icon, 'shrink-0 align-middle')} aria-hidden />
      </span>
    );
  }

  // Domyślnie: ikona + tekst
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
    >
      <Users className={clsx(S.icon, 'shrink-0 align-middle')} aria-hidden />
      <span className={clsx('truncate', S.text)}>{label}</span>
    </span>
  );
}

/* ───────────────────────────── Sizing ───────────────────────────── */

const SIZE_STYLES: Record<
  CapacityBadgeSize,
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

/* ───────────────────────────── Utils ───────────────────────────── */

function plural(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14))
    return forms[1];
  return forms[2];
}
