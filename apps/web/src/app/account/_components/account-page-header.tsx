'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

type Tab = {
  key: string;
  label: string;
  href: string;
};

type AccountPageHeaderProps = {
  title: string;
  description?: string;
  tabs?: Tab[];
  actions?: ReactNode;
};

/**
 * AccountPageHeader - Header section for account pages
 *
 * Contains:
 * - Page title
 * - Optional description
 * - Optional tabs (sub-navigation)
 * - Optional action buttons
 */
export function AccountPageHeader({
  title,
  description,
  tabs,
  actions,
}: AccountPageHeaderProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Title + Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>
          {description && (
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive =
                pathname === tab.href || pathname.startsWith(tab.href + '/');

              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
