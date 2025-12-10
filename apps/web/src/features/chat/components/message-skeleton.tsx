/**
 * Message Skeleton Component
 * Loading placeholder for chat messages
 */

'use client';

import { cn } from '@/lib/utils';

interface MessageSkeletonProps {
  /** Alignment of the skeleton message */
  align?: 'left' | 'right';
  /** Additional class names */
  className?: string;
}

/**
 * Single message skeleton
 */
export function MessageSkeleton({
  align = 'left',
  className,
}: MessageSkeletonProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 py-2 animate-pulse',
        align === 'right' ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {/* Avatar placeholder (only for left-aligned) */}
      {align === 'left' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
      )}

      <div
        className={cn(
          'flex flex-col gap-1',
          align === 'right' ? 'items-end' : 'items-start'
        )}
      >
        {/* Message bubble placeholder */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            align === 'right'
              ? 'bg-indigo-200 dark:bg-indigo-900/50 rounded-br-md'
              : 'bg-zinc-200 dark:bg-zinc-700 rounded-bl-md'
          )}
        >
          {/* Text lines */}
          <div className="space-y-2">
            <div
              className={cn(
                'h-3 rounded',
                align === 'right'
                  ? 'bg-indigo-300 dark:bg-indigo-800'
                  : 'bg-zinc-300 dark:bg-zinc-600'
              )}
              style={{ width: `${Math.random() * 100 + 100}px` }}
            />
            <div
              className={cn(
                'h-3 rounded',
                align === 'right'
                  ? 'bg-indigo-300 dark:bg-indigo-800'
                  : 'bg-zinc-300 dark:bg-zinc-600'
              )}
              style={{ width: `${Math.random() * 60 + 60}px` }}
            />
          </div>
        </div>

        {/* Timestamp placeholder */}
        <div
          className={cn(
            'h-2 w-10 rounded',
            align === 'right'
              ? 'bg-zinc-200 dark:bg-zinc-700'
              : 'bg-zinc-200 dark:bg-zinc-700'
          )}
        />
      </div>
    </div>
  );
}

interface MessageSkeletonListProps {
  /** Number of skeleton messages to show */
  count?: number;
  /** Additional class names */
  className?: string;
}

/**
 * List of message skeletons for loading state
 */
export function MessageSkeletonList({
  count = 5,
  className,
}: MessageSkeletonListProps) {
  // Create alternating pattern for realistic look
  const alignments: Array<'left' | 'right'> = [];
  for (let i = 0; i < count; i++) {
    // More messages from others than self typically
    alignments.push(Math.random() > 0.3 ? 'left' : 'right');
  }

  return (
    <div className={cn('flex flex-col px-4', className)}>
      {alignments.map((align, index) => (
        <MessageSkeleton key={index} align={align} />
      ))}
    </div>
  );
}

/**
 * Chat loading state with header skeleton
 */
export function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
          <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 overflow-hidden py-4">
        <MessageSkeletonList count={6} />
      </div>

      {/* Input skeleton */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
          <div className="flex-1 h-5 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    </div>
  );
}
