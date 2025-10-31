export function CapacityProgressBar({
  joinedCount,
  max,
}: {
  joinedCount: number;
  max: number;
}) {
  const pct = Math.min(100, Math.round((joinedCount / Math.max(1, max)) * 100));
  // HSL: 130° (zielony) → 0° (czerwony)
  const hue = Math.max(0, 130 - Math.round((130 * pct) / 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>Zapełnienie</span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div
          className="h-full w-0 rounded-full transition-[width,background-color] duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: `hsl(${hue} 70% 45%)`,
          }}
        />
      </div>
    </div>
  );
}
