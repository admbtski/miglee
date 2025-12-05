import { ReactNode } from 'react';

type AccountEmptyStateProps = {
  illustration?: ReactNode;
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: 'default' | 'compact';
};

/**
 * AccountEmptyState - Flexible empty state component
 *
 * Variants:
 * - default: 2-column layout with illustration
 * - compact: Single column centered layout
 */
export function AccountEmptyState({
  illustration,
  icon,
  title,
  description,
  action,
  variant = 'default',
}: AccountEmptyStateProps) {
  if (variant === 'compact') {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-12">
        <div className="text-center max-w-md mx-auto px-4">
          {icon && (
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              {icon}
            </div>
          )}
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            {title}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{description}</p>
          {action && <div className="flex justify-center">{action}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center py-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-center">
          {/* Left column: Illustration or Icon */}
          <div className="flex items-center justify-center order-2 md:order-1">
            {illustration ? (
              <div className="w-full max-w-sm">{illustration}</div>
            ) : icon ? (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 shadow-inner">
                {icon}
              </div>
            ) : null}
          </div>

          {/* Right column: Text + CTA */}
          <div className="space-y-6 text-center md:text-left order-1 md:order-2">
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
