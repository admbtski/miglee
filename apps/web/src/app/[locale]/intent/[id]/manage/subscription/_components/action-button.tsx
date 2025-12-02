'use client';

import { Loader2 } from 'lucide-react';
import * as React from 'react';
import clsx from 'clsx';

import { CooldownRing } from '@/components/ui/cooldown-ring';
import { ClickBurst } from '@/components/ui/click-burst';
import { ClickParticle } from '@/components/ui/click-particle';

/** ---------- Unified ActionButton ---------- */
export function ActionButton({
  label,
  icon,
  busyIcon,
  onClick,
  disabled,
  cooldownSeconds = 0,
  isCooling = false,
}: {
  label: string;
  icon: React.ReactNode;
  busyIcon?: React.ReactNode;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  cooldownSeconds?: number;
  isCooling?: boolean;
}) {
  const [burstTick, setBurstTick] = React.useState(0);
  const [glow, setGlow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    if (disabled || isCooling || loading) return;
    setBurstTick((x) => x + 1);
    setGlow(true);
    const t = setTimeout(() => setGlow(false), 500);
    try {
      setLoading(true);
      await onClick?.();
    } finally {
      setLoading(false);
      clearTimeout(t);
      setGlow(false);
    }
  };

  return (
    <div
      className={clsx(
        'relative',
        glow && 'ring-2 ring-indigo-400/60 rounded-2xl transition'
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isCooling || loading}
        className={clsx(
          'relative inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400/60',
          disabled || isCooling || loading
            ? 'cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md hover:shadow-lg'
        )}
      >
        <span className="relative">
          {loading
            ? (busyIcon ?? <Loader2 className="w-4 h-4 animate-spin" />)
            : icon}
        </span>
        <span className="relative">{label}</span>

        {(isCooling || cooldownSeconds > 0) && (
          <span className="ml-2">
            <CooldownRing seconds={cooldownSeconds} total={5} />
          </span>
        )}

        <ClickBurst trigger={burstTick} />
      </button>

      <ClickParticle trigger={burstTick} />
    </div>
  );
}
