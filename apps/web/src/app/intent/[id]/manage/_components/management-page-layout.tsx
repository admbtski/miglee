import { ReactNode } from 'react';

interface ManagementPageLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * Common layout for management pages
 * Provides consistent header and spacing
 */
export function ManagementPageLayout({
  title,
  description,
  children,
  actions,
}: ManagementPageLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
