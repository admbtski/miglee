/**
 * Global loading skeleton component
 */

'use client';

import { memo } from 'react';

type LoadingSkeletonProps = {
  count?: number;
  height?: string;
  className?: string;
  variant?: 'card' | 'list' | 'text' | 'avatar' | 'custom';
  animated?: boolean;
};

export const LoadingSkeleton = memo(function LoadingSkeleton({
  count = 6,
  height = 'h-48',
  className = '',
  variant = 'card',
  animated = true,
}: LoadingSkeletonProps) {
  const animationClass = animated ? 'animate-pulse' : '';

  if (variant === 'text') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={`skeleton-text-${i}`}
            className={`${animationClass} rounded-lg bg-zinc-200 dark:bg-zinc-800 h-4`}
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={`skeleton-list-${i}`}
            className={`${animationClass} flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900`}
          >
            <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-800 w-3/4" />
              <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-800 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={`skeleton-avatar-${i}`}
            className={`${animationClass} w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800`}
          />
        ))}
      </div>
    );
  }

  // Default: card variant
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skeleton-card-${i}`}
          className={`${animationClass} w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden ${height} ${className}`}
        >
          {/* Image placeholder */}
          <div className="h-1/2 bg-zinc-200 dark:bg-zinc-800" />

          {/* Content placeholder */}
          <div className="p-4 space-y-3">
            <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-800 w-3/4" />
            <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-800 w-1/2" />
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-6 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
});

/**
 * Simple skeleton line for inline use
 */
export const SkeletonLine = memo(function SkeletonLine({
  width = 'w-full',
  height = 'h-4',
  className = '',
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 ${width} ${height} ${className}`}
    />
  );
});

/**
 * Skeleton for page content
 */
export const PageSkeleton = memo(function PageSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="animate-pulse h-8 w-1/3 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="animate-pulse h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LoadingSkeleton count={6} variant="card" height="h-64" />
      </div>
    </div>
  );
});
