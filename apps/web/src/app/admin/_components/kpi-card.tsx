'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

type KPICardProps = {
  title: string;
  value: string | number;
  trend?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'indigo' | 'emerald';
};

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  green: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  purple:
    'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  indigo:
    'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  emerald:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export function KPICard({
  title,
  value,
  trend,
  icon: Icon,
  color,
}: KPICardProps) {
  const isPositive = trend?.startsWith('+');
  const isNegative = trend?.startsWith('-');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-between">
        <div className={clsx('rounded-lg p-3', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div
            className={clsx(
              'flex items-center gap-1 text-sm font-medium',
              isPositive && 'text-green-600 dark:text-green-400',
              isNegative && 'text-red-600 dark:text-red-400',
              !isPositive && !isNegative && 'text-gray-600 dark:text-gray-400'
            )}
          >
            {isPositive && <TrendingUp className="h-4 w-4" />}
            {isNegative && <TrendingDown className="h-4 w-4" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </div>
    </div>
  );
}
