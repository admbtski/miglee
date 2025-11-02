export function QuotaBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
