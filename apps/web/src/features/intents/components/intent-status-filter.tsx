'use client';

import { Calendar, Play, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { useMemo } from 'react';

/* ───────────────────────────── Types ───────────────────────────── */

export type IntentStatusFilterValue =
  | 'upcoming'
  | 'ongoing'
  | 'finished'
  | 'canceled'
  | 'deleted';

interface StatusOption {
  value: IntentStatusFilterValue;
  labelKey: keyof typeof import('@/lib/i18n/locales/en').en.myIntents.filters;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'upcoming', labelKey: 'upcoming', icon: Calendar },
  { value: 'ongoing', labelKey: 'ongoing', icon: Play },
  { value: 'finished', labelKey: 'finished', icon: CheckCircle },
  { value: 'canceled', labelKey: 'canceled', icon: XCircle },
  { value: 'deleted', labelKey: 'canceled', icon: Trash2 }, // Note: using 'canceled' key for 'deleted' value
];

export interface IntentStatusFilterProps {
  values: IntentStatusFilterValue[];
  onChange: (values: IntentStatusFilterValue[]) => void;
}

/* ───────────────────────────── Component ───────────────────────────── */

export function IntentStatusFilter({
  values,
  onChange,
}: IntentStatusFilterProps) {
  const { t } = useI18n();

  const options = useMemo(
    () =>
      STATUS_OPTIONS.map((opt) => ({
        ...opt,
        label: t.myIntents.filters[opt.labelKey],
      })),
    [t]
  );

  const toggleStatus = (status: IntentStatusFilterValue) => {
    if (values.includes(status)) {
      // Remove if already selected
      const newValues = values.filter((v) => v !== status);
      // Ensure at least one is selected
      if (newValues.length > 0) {
        onChange(newValues);
      }
    } else {
      // Add to selection
      onChange([...values, status]);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {t.myIntents.filters.status}
      </h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = values.includes(option.value);

          return (
            <button
              key={option.value}
              onClick={() => toggleStatus(option.value)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500/20 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-500/30'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {t.myIntents.multipleSelectionAllowed}
      </p>
    </div>
  );
}
