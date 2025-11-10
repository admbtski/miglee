/**
 * Global loading skeleton component
 */

'use client';

import { memo } from 'react';

type LoadingSkeletonProps = {
  count?: number;
  height?: string;
  className?: string;
};

export const LoadingSkeleton = memo(function LoadingSkeleton({
  count = 6,
  height = 'h-48',
  className = '',
}: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className={`w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900 ${height} ${className}`}
        />
      ))}
    </>
  );
});
