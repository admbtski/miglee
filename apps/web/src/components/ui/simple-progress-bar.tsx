import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const progressColorClass = (active: boolean) =>
  active
    ? 'bg-zinc-900 dark:bg-white/80'
    : 'bg-zinc-400 dark:bg-zinc-600';

export function SimpleProgressBar({
  value,
  active,
  label = 'Postęp zapełnienia',
  className,
}: {
  value: number;
  active: boolean;
  label?: string;
  className?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      className={twMerge(
        'h-1.5 w-full bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden',
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safe}
      aria-label={label}
      aria-valuetext={`${safe}%`}
    >
      <div
        className={clsx('h-full', progressColorClass(active))}
        style={{
          width: `${safe}%`,
          // minimalny „zauważalny" pasek, gdy value>0
          minWidth: safe > 0 ? 8 : 0,
        }}
      />
    </div>
  );
}
