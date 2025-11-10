'use client';

import { memo } from 'react';

type LoadingSkeletonProps = {
  count?: number;
};

export const LoadingSkeleton = memo(function LoadingSkeleton({
  count = 6,
}: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="w-full h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900"
        />
      ))}
    </>
  );
});
