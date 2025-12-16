'use client';

import * as React from 'react';
import clsx from 'clsx';
import { Crown, Shield, User as UserIcon } from 'lucide-react';

/**
 * Avatar:
 * - 9-patch fallback tła (różne odcienie po hash inicjałów), ale prosty wariant aby nie wnosić dodatkowej logiki – zostaje neutralny.
 * - Ostrożne rozmiary (8) spójne z listą.
 */
export function Avatar({ src, name }: { src?: string | null; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/60 dark:ring-black/40"
      />
    );
  }
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 ring-1 ring-white/60 dark:bg-zinc-700 dark:text-zinc-100 dark:ring-black/40">
      {initials || '?'}
    </div>
  );
}

/**
 * Badge:
 * - Delikatny ring-inset dla lepszej separacji na jasnym tle.
 * - Wspólny rozmiar i padding; kolory dostarcza klasa z mapy.
 */
export function Badge({
  children,
  className,
  title,
}: React.PropsWithChildren<{ className?: string; title?: string }>) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none',
        'ring-1 ring-inset ring-black/5 dark:ring-white/5',
        className
      )}
      title={title}
    >
      {children}
    </span>
  );
}

export const iconForRole = (role: 'OWNER' | 'MODERATOR' | 'PARTICIPANT') =>
  role === 'OWNER' ? (
    <Crown className="h-4 w-4" />
  ) : role === 'MODERATOR' ? (
    <Shield className="h-4 w-4" />
  ) : (
    <UserIcon className="h-4 w-4" />
  );
