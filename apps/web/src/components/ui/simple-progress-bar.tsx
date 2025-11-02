import clsx from 'clsx';

const progressColorClass = (active: boolean) =>
  active
    ? 'bg-neutral-900 dark:bg-white'
    : 'bg-neutral-400 dark:bg-neutral-600';

export function SimpleProgressBar({
  value,
  active,
  label = 'Postęp zapełnienia',
}: {
  value: number;
  active: boolean;
  label?: string;
}) {
  return (
    <div
      className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label}
    >
      <div
        className={clsx('h-full', progressColorClass(active))}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
