'use client';

import Link from 'next/link';
import { AlertTriangle, XCircle, Info, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

type AlertCardProps = {
  type: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  action?: string;
  href?: string;
};

const typeConfig = {
  info: {
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-800',
    iconClass: 'text-blue-600 dark:text-blue-400',
    textClass: 'text-blue-900 dark:text-blue-100',
    descClass: 'text-blue-700 dark:text-blue-300',
    buttonClass:
      'text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-800',
    iconClass: 'text-amber-600 dark:text-amber-400',
    textClass: 'text-amber-900 dark:text-amber-100',
    descClass: 'text-amber-700 dark:text-amber-300',
    buttonClass:
      'text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100',
  },
  error: {
    icon: XCircle,
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-800',
    iconClass: 'text-red-600 dark:text-red-400',
    textClass: 'text-red-900 dark:text-red-100',
    descClass: 'text-red-700 dark:text-red-300',
    buttonClass:
      'text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100',
  },
};

export function AlertCard({
  type,
  title,
  description,
  action,
  href,
}: AlertCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        config.bgClass,
        config.borderClass
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={clsx('h-5 w-5 flex-shrink-0', config.iconClass)} />
        <div className="flex-1">
          <h3 className={clsx('text-sm font-semibold', config.textClass)}>
            {title}
          </h3>
          <p className={clsx('mt-1 text-sm', config.descClass)}>
            {description}
          </p>
          {action && href && (
            <Link
              href={href}
              className={clsx(
                'mt-2 inline-flex items-center gap-1 text-sm font-medium',
                config.buttonClass
              )}
            >
              {action}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
