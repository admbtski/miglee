import { Calendar, Play, CheckCircle, XCircle, Trash2 } from 'lucide-react';

/* ───────────────────────────── Types ───────────────────────────── */

export type IntentStatusFilterValue =
  | 'upcoming'
  | 'ongoing'
  | 'finished'
  | 'canceled'
  | 'deleted';

interface StatusOption {
  value: IntentStatusFilterValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'upcoming', label: 'Upcoming', icon: Calendar },
  { value: 'ongoing', label: 'Ongoing', icon: Play },
  { value: 'finished', label: 'Finished', icon: CheckCircle },
  { value: 'canceled', label: 'Canceled', icon: XCircle },
  { value: 'deleted', label: 'Deleted', icon: Trash2 },
];

export interface IntentStatusFilterProps {
  values: IntentStatusFilterValue[];
  onChange: (values: IntentStatusFilterValue[]) => void;
}

/* ───────────────────────────── Component ───────────────────────────── */

export function IntentStatusFilter({
  values,
  onChange,
}: IntentStatusFilterProps): JSX.Element {
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
        Event Status
      </h3>
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => {
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
        Multiple selection allowed
      </p>
    </div>
  );
}
