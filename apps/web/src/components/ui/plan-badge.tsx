// components/ui/plan-badge.tsx
import clsx from 'clsx';
import { planText, planTheme, type Plan } from './plan-theme'; // ⬅️ NOWE

type PlanBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type PlanBadgeVariant = 'icon' | 'iconText';

const SIZE_STYLES: Record<
  PlanBadgeSize,
  { container: string; icon: string; text: string; gap: string }
> = {
  xs: {
    container: 'px-1 py-0.5 rounded-full',
    icon: 'w-3 h-3',
    text: 'text-[10px] leading-none',
    gap: 'gap-1',
  },
  sm: {
    container: 'px-1.5 py-0.5 rounded-full',
    icon: 'w-3.5 h-3.5',
    text: 'text-[11px] leading-none',
    gap: 'gap-1.5',
  },
  md: {
    container: 'px-2 py-0.5 rounded-full',
    icon: 'w-4 h-4',
    text: 'text-xs leading-none',
    gap: 'gap-1.5',
  },
  lg: {
    container: 'px-2.5 py-0.5 rounded-full',
    icon: 'w-5 h-5',
    text: 'text-sm leading-none',
    gap: 'gap-2',
  },
  xl: {
    container: 'px-3 py-1 rounded-full',
    icon: 'w-6 h-6',
    text: 'text-base leading-none',
    gap: 'gap-2',
  },
};

export function PlanBadge({
  plan = 'default',
  size = 'sm',
  variant = 'iconText',
  text,
  icon,
  title,
  className,
  label,
}: {
  plan?: Plan;
  size?: PlanBadgeSize;
  variant?: PlanBadgeVariant;
  text?: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
  className?: string;
  label?: React.ReactNode;
}) {
  if (label) {
    return (
      <div
        className={clsx(
          'pointer-events-none inline-flex shrink-0 items-center justify-center select-none shadow-sm',
          SIZE_STYLES[size].container,
          className
        )}
        title={title}
        aria-hidden
      >
        {label}
      </div>
    );
  }

  const theme = planTheme(plan);
  const S = SIZE_STYLES[size];
  const defaultText = planText(plan);

  const IconNode = icon ? (
    icon
  ) : theme.Icon ? (
    <theme.Icon className={clsx(S.icon, theme.iconClass)} aria-hidden />
  ) : null;

  if (variant === 'icon') {
    return (
      <div
        className={clsx(
          'pointer-events-none inline-flex items-center justify-center select-none shadow-sm',
          theme.chipClass,
          S.container,
          className
        )}
        title={title}
        aria-hidden
      >
        {IconNode}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'pointer-events-none inline-flex items-center select-none shadow-sm',
        theme.chipClass,
        S.container,
        S.gap,
        className
      )}
      title={title ?? (typeof text === 'string' ? text : defaultText)}
      aria-hidden
    >
      {IconNode}
      <span className={S.text}>{text ?? defaultText}</span>
    </div>
  );
}
