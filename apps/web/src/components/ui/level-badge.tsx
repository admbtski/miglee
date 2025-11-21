'use client';

import { Level } from '@/lib/api/__generated__/react-query-update';
import clsx from 'clsx';
import { Gauge, Rocket, Sprout } from 'lucide-react';

const LEVEL_ORDER: Record<Level, number> = {
  [Level.Beginner]: 0,
  [Level.Intermediate]: 1,
  [Level.Advanced]: 2,
};

export const sortLevels = (levels: Level[]) => {
  return (levels ?? []).slice().sort((a, b) => LEVEL_ORDER[a] - LEVEL_ORDER[b]);
};

/* ───────────────────────────── Meta ───────────────────────────── */

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const LEVEL_META: Record<
  Level,
  { label: string; Icon: IconType; tone: string; ring: string }
> = {
  [Level.Beginner]: {
    label: 'Beginner',
    Icon: Sprout,
    tone: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-700/60',
  },
  [Level.Intermediate]: {
    label: 'Intermediate',
    Icon: Gauge,
    tone: 'text-indigo-700 dark:text-indigo-300',
    ring: 'ring-indigo-200 dark:ring-indigo-700/60',
  },
  [Level.Advanced]: {
    label: 'Advanced',
    Icon: Rocket,
    tone: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-200 dark:ring-amber-700/60',
  },
};

/* ───────────────────────────── Sizing ───────────────────────────── */

export type LevelBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LevelBadgeVariant = 'icon' | 'iconText' | 'text';

const SIZE_STYLES: Record<
  LevelBadgeSize,
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
    gap: 'gap-1.5',
  },
  md: {
    container: 'px-2.5 py-0.5 rounded-full',
    icon: 'w-4 h-4',
    text: 'text-xs leading-none',
    gap: 'gap-1.5',
  },
  lg: {
    container: 'px-3 py-0.5 rounded-full',
    icon: 'w-5 h-5',
    text: 'text-sm leading-none',
    gap: 'gap-2',
  },
  xl: {
    container: 'px-3.5 py-1 rounded-full',
    icon: 'w-6 h-6',
    text: 'text-base leading-none',
    gap: 'gap-2',
  },
};

/* ───────────────────────────── Single badge ───────────────────────────── */

export function LevelBadge({
  level,
  size = 'md',
  variant = 'iconText',
  className,
  title,
  label, // override tekstu
  icon, // override ikony
}: {
  level: Level;
  size?: LevelBadgeSize;
  variant?: LevelBadgeVariant;
  className?: string;
  title?: string;
  label?: string;
  icon?: React.ReactNode;
}) {
  const S = SIZE_STYLES[size];
  const meta = LEVEL_META[level];

  const IconNode = icon ?? (
    <meta.Icon className={clsx(S.icon, 'align-middle')} aria-hidden />
  );
  const baseClasses = clsx(
    'inline-flex items-center ring-1 shadow-sm select-none bg-white/80 dark:bg-zinc-900/60 truncate',
    meta.tone,
    meta.ring,
    S.container,
    className
  );

  if (variant === 'icon') {
    return (
      <span
        className={baseClasses}
        title={title ?? meta.label}
        aria-label={title ?? meta.label}
      >
        {IconNode}
      </span>
    );
  }

  if (variant === 'text') {
    return (
      <span
        className={clsx(
          'inline-flex items-center select-none truncate',
          S.text,
          className
        )}
        title={title ?? meta.label}
        aria-label={title ?? meta.label}
      >
        {label ?? meta.label}
      </span>
    );
  }

  return (
    <span
      className={clsx(baseClasses, S.gap)}
      title={title ?? meta.label}
      aria-label={title ?? meta.label}
    >
      {IconNode}
      <span className={clsx('font-medium truncate', S.text)}>
        {label ?? meta.label}
      </span>
    </span>
  );
}
