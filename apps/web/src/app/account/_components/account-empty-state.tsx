import { ReactNode } from 'react';

type AccountEmptyStateProps = {
  illustration: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

/**
 * AccountEmptyState - 2-column empty state layout
 *
 * Layout:
 * - Left column: Visual element (illustration/icon)
 * - Right column: Text + CTA button
 * - Centered with large whitespace
 */
export function AccountEmptyState({
  illustration,
  title,
  description,
  action,
}: AccountEmptyStateProps) {
  return (
    <div className="flex min-h-[500px] items-center justify-center py-12">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
          {/* Left column: Illustration */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm">{illustration}</div>
          </div>

          {/* Right column: Text + CTA */}
          <div className="space-y-6 text-center md:text-left">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {title}
              </h2>
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {description}
              </p>
            </div>

            {action && (
              <div className="flex justify-center md:justify-start">
                {action}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
