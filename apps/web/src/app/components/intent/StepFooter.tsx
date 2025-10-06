'use client';

export function StepFooter({
  canBack,
  canNext,
  onBack,
  onNext,
  nextLabel = 'Next',
  primary = true,
}: {
  canBack: boolean;
  canNext: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  primary?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-t px-6 py-4
                    border-zinc-200 dark:border-zinc-800"
    >
      <button
        type="button"
        onClick={onBack}
        disabled={!canBack}
        className="rounded-2xl border px-4 py-2 text-sm disabled:opacity-50
                   border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50
                   dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-900"
      >
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className={[
          'rounded-2xl px-4 py-2 text-sm font-medium disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          primary
            ? 'bg-indigo-600 text-white hover:bg-indigo-500'
            : 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-900',
        ].join(' ')}
      >
        {nextLabel}
      </button>
    </div>
  );
}
