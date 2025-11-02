export function CooldownRing({
  seconds,
  total = 10,
}: {
  seconds: number;
  total?: number;
}) {
  const pct = Math.max(0, Math.min(1, seconds / total));
  const deg = pct * 360;
  return (
    <div className="relative inline-flex h-5 w-5 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundImage: `conic-gradient(rgb(63 63 70) ${deg}deg, rgb(228 228 231) ${deg}deg)`,
        }}
      />
      <div className="absolute inset-[3px] rounded-full bg-white dark:bg-zinc-900" />
      <span className="relative text-[10px] font-semibold tabular-nums leading-none">
        {seconds}
      </span>
    </div>
  );
}
