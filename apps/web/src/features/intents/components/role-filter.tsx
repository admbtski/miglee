'use client';

import {
  Users,
  Crown,
  Shield,
  User,
  Clock,
  Mail,
  XCircle,
  Ban,
  ListOrdered,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { useMemo } from 'react';

/* ───────────────────────────── Types ───────────────────────────── */

export type RoleFilterValue =
  | 'all'
  | 'owner'
  | 'moderator'
  | 'member'
  | 'pending'
  | 'invited'
  | 'rejected'
  | 'banned'
  | 'waitlist';

interface RoleOption {
  value: RoleFilterValue;
  labelKey: keyof typeof import('@/lib/i18n/locales/en').en.myIntents.filters;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'all', labelKey: 'all', icon: Users },
  { value: 'owner', labelKey: 'owner', icon: Crown },
  { value: 'moderator', labelKey: 'moderator', icon: Shield },
  { value: 'member', labelKey: 'member', icon: User },
  { value: 'pending', labelKey: 'pending', icon: Clock },
  { value: 'invited', labelKey: 'invited', icon: Mail },
  { value: 'rejected', labelKey: 'rejected', icon: XCircle },
  { value: 'banned', labelKey: 'banned', icon: Ban },
  { value: 'waitlist', labelKey: 'waitlist', icon: ListOrdered },
];

export interface RoleFilterProps {
  value: RoleFilterValue;
  onChange: (value: RoleFilterValue) => void;
}

/* ───────────────────────────── Component ───────────────────────────── */

export function RoleFilter({ value, onChange }: RoleFilterProps) {
  const { t } = useI18n();

  const options = useMemo(
    () =>
      ROLE_OPTIONS.map((opt) => ({
        ...opt,
        label: t.myIntents.filters[opt.labelKey],
      })),
    [t]
  );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {t.myIntents.filters.role}
      </h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-500/20 dark:bg-pink-900/30 dark:text-pink-300 dark:ring-pink-500/30'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
