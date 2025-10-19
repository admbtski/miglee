'use client';

import React from 'react';
import { CheckCircle2, CreditCard, Lock } from 'lucide-react';

/* ——— Shared UI atoms ——— */

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-sm ring-1 ring-black/5 dark:border-zinc-700 dark:bg-[#171a1f]/80 sm:p-5">
      {children}
    </section>
  );
}

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

export function GhostButton({
  children,
  primary,
}: {
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm',
        primary
          ? 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:hover:bg-zinc-900'
          : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function PaymentRow({
  brand,
  last4,
  expires,
  isDefault,
  onEdit,
}: {
  brand: string;
  last4: string;
  expires: string;
  isDefault?: boolean;
  onEdit?: () => void;
}) {
  return (
    <div className="items-center justify-between p-3 border rounded-xl border-zinc-200 dark:border-zinc-700 sm:flex">
      <div className="flex items-center gap-3">
        <span className="grid rounded-lg h-9 w-9 place-items-center bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <CreditCard className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium truncate">
              {brand} •••• {last4}
            </div>
            {isDefault && (
              <Badge tone="emerald">
                <CheckCircle2 className="h-3.5 w-3.5" /> Default
              </Badge>
            )}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Debit Expires {expires}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 sm:mt-0">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Edit
        </button>
      </div>
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
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {children}
    </button>
  );
}

/* ——— Form helpers (light & dark) ——— */

export function Input({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  maxLength,
  leftIcon,
  rightAddon,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  leftIcon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </div>
      <div className="flex items-center gap-2 px-3 py-2 text-sm bg-white border outline-none rounded-xl placeholder:text-zinc-400 focus-within:ring-2 focus-within:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900/60">
        {leftIcon && <span className="text-zinc-500">{leftIcon}</span>}
        <input
          disabled={disabled}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full bg-transparent outline-none"
        />
        {rightAddon}
      </div>
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  rightIcon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  rightIcon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border outline-none appearance-none rounded-xl focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900/60"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {rightIcon && (
          <span className="absolute -translate-y-1/2 pointer-events-none right-2 top-1/2 text-zinc-500">
            {rightIcon}
          </span>
        )}
      </div>
    </label>
  );
}

export function SecureNote() {
  return (
    <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
      <Lock className="h-3.5 w-3.5" />
      This is a secure form
    </div>
  );
}

export function InfoItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3 border rounded-xl border-zinc-200 dark:border-zinc-800">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
export function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        'flex items-center justify-between px-4 py-3 text-sm',
        highlight
          ? 'bg-zinc-100 font-semibold dark:bg-zinc-800/60'
          : 'bg-zinc-50 dark:bg-zinc-900/40',
        'border-b border-zinc-200 last:border-b-0 dark:border-zinc-800',
      ].join(' ')}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
