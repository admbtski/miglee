'use client';

import React from 'react';
// Icons available: CheckCircle2, CreditCard, Lock from 'lucide-react'

export function Badge({
  children,
  tone = 'zinc',
}: {
  children: React.ReactNode;
  tone?: 'zinc' | 'indigo' | 'emerald' | 'amber';
}) {
  const map: Record<string, string> = {
    zinc: 'bg-zinc-100 text-zinc-700 ring-zinc-600/10 dark:bg-zinc-800 dark:text-zinc-300',
    indigo:
      'bg-indigo-100 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-900/30 dark:text-indigo-300',
    emerald:
      'bg-emerald-100 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber:
      'bg-amber-100 text-amber-800 ring-amber-700/15 dark:bg-amber-900/30 dark:text-amber-300',
  };
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1',
        map[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function Th({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={
        'px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300 ' + className
      }
    >
      {children}
    </th>
  );
}
export function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={'px-4 py-3 ' + className}>{children}</td>;
}

export function SmallButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
    >
      {children}
    </button>
  );
}
