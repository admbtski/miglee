import * as React from 'react';
import clsx from 'clsx';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'destructive'
  | 'success';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white border-transparent',
  secondary:
    'bg-zinc-100 text-zinc-900 border-transparent dark:bg-zinc-800 dark:text-zinc-100',
  outline:
    'border-zinc-300 bg-transparent text-zinc-900 dark:border-zinc-700 dark:text-zinc-100',
  destructive: 'bg-red-600 text-white border-transparent dark:bg-red-700',
  success: 'bg-green-600 text-white border-transparent dark:bg-green-700',
};

/**
 * Badge component for displaying labels, tags, and status indicators
 *
 * @example
 * ```tsx
 * <Badge variant="default">New</Badge>
 * <Badge variant="outline">Premium</Badge>
 * <Badge variant="success">Active</Badge>
 * ```
 */
export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
