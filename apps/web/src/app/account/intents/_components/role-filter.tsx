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
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'all', label: 'All', icon: Users },
  { value: 'owner', label: 'Owner', icon: Crown },
  { value: 'moderator', label: 'Moderator', icon: Shield },
  { value: 'member', label: 'Participant', icon: User },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'invited', label: 'Invited', icon: Mail },
  { value: 'rejected', label: 'Rejected', icon: XCircle },
  { value: 'banned', label: 'Banned', icon: Ban },
  { value: 'waitlist', label: 'Waitlist', icon: ListOrdered },
];

export interface RoleFilterProps {
  value: RoleFilterValue;
  onChange: (value: RoleFilterValue) => void;
}

/* ───────────────────────────── Component ───────────────────────────── */

export function RoleFilter({ value, onChange }: RoleFilterProps): JSX.Element {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        My Role
      </h3>
      <div className="flex flex-wrap gap-2">
        {ROLE_OPTIONS.map((option) => {
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
