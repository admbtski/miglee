'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

import { useLocalePath } from '@/hooks/use-locale-path';

interface Tab {
  key: string;
  label: string;
  href: string;
  icon?: ReactNode;
  count?: number;
}

interface AccountPageHeaderProps {
  title: string;
  description?: string;
  tabs?: Tab[];
  actions?: ReactNode;
  icon?: ReactNode;
}

export function AccountPageHeader({
  title,
  description,
  tabs,
  actions,
  icon,
}: AccountPageHeaderProps) {
  const pathname = usePathname();
  const { localePath } = useLocalePath();

  return (
    <div className="space-y-6">
      {/* Title + Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 shadow-sm">
              {icon}
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 sm:text-base max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const localizedHref = localePath(tab.href);
              const isActive =
                pathname === localizedHref ||
                pathname.startsWith(`${localizedHref}/`);

              return (
                <Link
                  key={tab.key}
                  href={localizedHref}
                  className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.icon && (
                    <span
                      className={
                        isActive ? 'text-indigo-600 dark:text-indigo-400' : ''
                      }
                    >
                      {tab.icon}
                    </span>
                  )}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {tab.count > 99 ? '99+' : tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="account-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
                      transition={{
                        type: 'spring',
                        bounce: 0.2,
                        duration: 0.4,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
