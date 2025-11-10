/**
 * Password strength indicator (0..4)
 */

'use client';

import { memo } from 'react';

type PasswordStrengthProps = {
  score: number;
  className?: string;
};

export const PasswordStrength = memo(function PasswordStrength({
  score,
  className = '',
}: PasswordStrengthProps) {
  return (
    <div className={`mt-1 ${className}`}>
      <div className="mb-1 text-xs text-zinc-500">Level:</div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={[
              'h-1.5 w-full rounded-full',
              i < score ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
});
