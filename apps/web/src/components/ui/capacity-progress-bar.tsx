import { twMerge } from 'tailwind-merge';

export const getPct = ({
  joinedCount,
  max,
}: {
  joinedCount: number;
  max: number;
}) => {
  return Math.min(100, Math.round((joinedCount / Math.max(1, max)) * 100));
};

export function CapacityProgressBar({
  joinedCount,
  max,
  className,
}: {
  joinedCount: number;
  max: number;
  className?: string;
}) {
  const pct = getPct({ joinedCount, max });
  // HSL: 130° (zielony) → 0° (czerwony)
  const hue = Math.max(0, 130 - Math.round((130 * pct) / 100));
  return (
    <div
      className={twMerge(
        'mt-1 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden',
        className
      )}
    >
      <div
        className="h-full w-0 rounded-full transition-[width,background-color] duration-500 ease-out"
        style={{
          width: `${pct}%`,
          backgroundColor: `hsl(${hue} 70% 45%)`,
        }}
      />
    </div>
  );
}
