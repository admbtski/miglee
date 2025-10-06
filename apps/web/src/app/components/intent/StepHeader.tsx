'use client';

export function StepHeader({
  title,
  step,
  total,
  onClose,
}: {
  title: string;
  step: number;
  total: number;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <button
        onClick={onClose}
        className="cursor-pointer rounded-lg p-2
                   text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900
                   dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
