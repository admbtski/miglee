// file: components/manage-members/ui.tsx
'use client';

import * as React from 'react';
import clsx from 'clsx';
import { Crown, Shield, User as UserIcon } from 'lucide-react';

export function Avatar({ src, name }: { src?: string | null; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
      {name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()}
    </div>
  );
}

export function Badge({
  children,
  className,
  title,
}: React.PropsWithChildren<{ className?: string; title?: string }>) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
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
