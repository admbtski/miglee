// components/ui/plan-theme.ts
import type { ComponentType } from 'react';
import { RocketIcon, StarIcon, StarsIcon } from 'lucide-react';

export type Plan = 'default' | 'basic' | 'plus' | 'premium';

export type PlanTheme = {
  ring: string;
  /** alias dla kompatybilności */
  bg: string;
  chipClass: string;
  iconClass: string;
  Icon?: ComponentType<{ className?: string }>;
  headerBg: string;
  sectionBg: string;
  glow?: string;
};

const DEFAULTS = {
  chip: 'bg-neutral-600 text-white dark:bg-neutral-500',
  icon: 'text-neutral-50',
  card: 'bg-white dark:bg-neutral-900',
  ring: 'ring-neutral-200/70 dark:ring-neutral-800',
  header:
    'bg-[radial-gradient(1200px_320px_at_0%_-15%,rgba(14,165,233,0.10),transparent_60%),radial-gradient(900px_260px_at_100%_0%,rgba(250,204,21,0.08),transparent_55%)]',
  section: 'bg-white/70 dark:bg-neutral-900/50',
};

export function planText(plan?: Plan) {
  switch (plan ?? 'default') {
    case 'basic':
      return 'Basic';
    case 'plus':
      return 'Plus';
    case 'premium':
      return 'Pro';
    default:
      return 'Standard';
  }
}

export function planTheme(plan?: Plan): PlanTheme {
  switch (plan ?? 'default') {
    case 'basic':
      return {
        ring: 'ring-emerald-300/60 dark:ring-emerald-700/50',
        bg: 'bg-emerald-50/40 dark:bg-emerald-900/10',
        chipClass: 'bg-emerald-600 text-white dark:bg-emerald-500',
        iconClass: 'text-emerald-50',
        Icon: StarsIcon,
        headerBg:
          'bg-[radial-gradient(1200px_360px_at_0%_-20%,rgba(16,185,129,0.18),transparent_62%),radial-gradient(1000px_300px_at_100%_0%,rgba(52,211,153,0.16),transparent_58%),linear-gradient(135deg,rgba(16,185,129,0.06),transparent_60%)]',
        sectionBg: 'bg-emerald-50/30 dark:bg-emerald-900/8',
        glow: 'shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_10px_30px_-10px_rgba(16,185,129,0.35)]',
      };
    case 'plus':
      return {
        ring: 'ring-indigo-300/60 dark:ring-indigo-700/50',
        bg: 'bg-indigo-50/40 dark:bg-indigo-900/10',
        chipClass: 'bg-indigo-600 text-white dark:bg-indigo-500',
        iconClass: 'text-indigo-50',
        Icon: StarIcon,
        headerBg:
          'bg-[radial-gradient(1200px_360px_at_0%_-20%,rgba(99,102,241,0.18),transparent_62%),radial-gradient(1000px_300px_at_100%_0%,rgba(165,180,252,0.16),transparent_58%),linear-gradient(135deg,rgba(99,102,241,0.06),transparent_60%)]',
        sectionBg: 'bg-indigo-50/30 dark:bg-indigo-900/8',
        glow: 'shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_10px_30px_-10px_rgba(99,102,241,0.35)]',
      };
    case 'premium':
      return {
        ring: 'ring-amber-400/70 dark:ring-amber-700/60',
        bg: 'bg-amber-50/45 dark:bg-amber-900/10',
        chipClass: 'bg-amber-600 text-white dark:bg-amber-500',
        iconClass: 'text-amber-50',
        Icon: RocketIcon,
        headerBg:
          'bg-[radial-gradient(1200px_360px_at_0%_-20%,rgba(245,158,11,0.22),transparent_62%),radial-gradient(1100px_320px_at_100%_0%,rgba(253,230,138,0.18),transparent_58%),linear-gradient(135deg,rgba(245,158,11,0.08),transparent_60%)]',
        sectionBg: 'bg-amber-50/30 dark:bg-amber-900/8',
        glow: 'shadow-[0_0_0_1px_rgba(245,158,11,0.28),0_12px_34px_-12px_rgba(245,158,11,0.38)]',
      };
    default:
      return {
        ring: DEFAULTS.ring,
        bg: DEFAULTS.card,
        chipClass: DEFAULTS.chip,
        iconClass: DEFAULTS.icon,
        headerBg: DEFAULTS.header,
        sectionBg: DEFAULTS.section,
        glow: 'shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_10px_30px_-10px_rgba(0,0,0,0.12)]',
      };
  }
}
