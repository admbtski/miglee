/**
 * Avatar component for chat users
 */

'use client';

import { memo } from 'react';

type AvatarProps = {
  token?: string;
  size?: 'sm' | 'md' | 'lg';
};

export const Avatar = memo(function Avatar({
  token,
  size = 'md',
}: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
  };

  const sizeClass = sizeClasses[size];

  if (!token) {
    return (
      <div
        className={`grid text-xs font-semibold bg-white border ${sizeClass} place-items-center rounded-xl border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800`}
      >
        ?
      </div>
    );
  }

  const isUrl = /^(https?:)?\/\//.test(token);

  return isUrl ? (
    <img
      alt=""
      src={token}
      className={`object-cover ${sizeClass} rounded-xl`}
    />
  ) : (
    <div
      className={`grid text-xs font-semibold text-white bg-indigo-600 ${sizeClass} place-items-center rounded-xl`}
    >
      {token.slice(0, 2)}
    </div>
  );
});
