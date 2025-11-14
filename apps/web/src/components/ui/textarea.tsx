import * as React from 'react';
import clsx from 'clsx';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea component for multi-line text input
 * Provides consistent styling across the application
 *
 * @example
 * ```tsx
 * <Textarea placeholder="Enter your message..." rows={4} />
 * <Textarea maxLength={500} placeholder="Limited to 500 characters" />
 * ```
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={clsx(
          'flex min-h-[80px] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm',
          'placeholder:text-zinc-400',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-none',
          'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100',
          'dark:focus:ring-indigo-400',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
