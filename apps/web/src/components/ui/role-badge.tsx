'use client';

import { IntentMemberRole } from '@/lib/api/__generated__/react-query-update';
import clsx from 'clsx';
import { Crown, Shield, User as UserIcon } from 'lucide-react';

export type RoleBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type RoleBadgeVariant = 'icon' | 'iconText';

const SIZE_STYLES: Record<
  RoleBadgeSize,
  { container: string; icon: string; text: string; gap: string }
> = {
  xs: {
    container: 'px-1 py-0.5 rounded-full',
    icon: 'w-3 h-3',
    text: 'text-[10px] leading-none',
    gap: 'gap-1',
  },
  sm: {
    container: 'px-1.5 py-0.5 rounded-full',
    icon: 'w-3.5 h-3.5',
    text: 'text-[11px] leading-none',
    gap: 'gap-1.5',
  },
  md: {
    container: 'px-2 py-0.5 rounded-full',
    icon: 'w-4 h-4',
    text: 'text-xs leading-none',
    gap: 'gap-1.5',
  },
  lg: {
    container: 'px-2.5 py-0.5 rounded-full',
    icon: 'w-5 h-5',
    text: 'text-sm leading-none',
    gap: 'gap-2',
  },
  xl: {
    container: 'px-3 py-1 rounded-full',
    icon: 'w-6 h-6',
    text: 'text-base leading-none',
    gap: 'gap-2',
  },
};

const ROLE_STYLES: Record<
  IntentMemberRole,
  { container: string; defaultLabel: string; Icon: React.ComponentType<any> }
> = {
  OWNER: {
    container:
      'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/50',
    defaultLabel: 'Owner',
    Icon: Crown,
  },
  MODERATOR: {
    container:
      'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800/50',
    defaultLabel: 'Moderator',
    Icon: Shield,
  },
  PARTICIPANT: {
    container:
      'bg-neutral-100 text-neutral-700 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700',
    defaultLabel: 'Uczestnik',
    Icon: UserIcon,
  },
};

export function RoleBadge({
  role,
  size = 'sm',
  variant = 'iconText',
  className,
  title,
  icon,
  label,
}: {
  role: IntentMemberRole;
  size?: RoleBadgeSize;
  variant?: RoleBadgeVariant;
  className?: string;
  title?: string;
  /** własna ikona – jeżeli podasz, nadpisze domyślną */
  icon?: React.ReactNode;
  /** własny label – jeżeli nie podasz, użyjemy domyślnego dla roli */
  label?: string;
}) {
  const S = SIZE_STYLES[size];
  const R = ROLE_STYLES[role];

  const IconNode =
    icon ??
    (R.Icon && S.icon ? <R.Icon className={clsx(S.icon)} aria-hidden /> : null);

  if (variant === 'icon') {
    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center rounded-full ring-1 shadow-sm select-none',
          R.container,
          S.container,
          className
        )}
        title={title ?? label ?? R.defaultLabel}
        aria-live="polite"
      >
        {IconNode}
      </span>
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full ring-1 shadow-sm select-none',
        R.container,
        S.container,
        S.gap,
        className
      )}
      title={title ?? label ?? R.defaultLabel}
      aria-live="polite"
    >
      {IconNode}
      <span className={S.text}>{label ?? R.defaultLabel}</span>
    </span>
  );
}

/* Przydatne: szybki helper do wyboru ikony po roli */
export function iconForRole(role: IntentMemberRole) {
  return ROLE_STYLES[role].Icon;
}
