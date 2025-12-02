'use client';

import { Loader2, Rocket, Sparkles } from 'lucide-react';
import * as React from 'react';

import { QuotaBar } from '@/components/ui/quota-bar';
import { useCooldown } from '@/hooks/use-cooldown';
import { ActionButton } from './action-button';
import { SponsorshipState } from './subscription-panel-types';

type BoostPageProps = {
  intentId: string;
  sponsorship: SponsorshipState & {
    boostedAt?: string | null;
  };
  onBoostEvent?: (intentId: string) => Promise<void> | void;
};

export function BoostPage({
  intentId,
  sponsorship,
  onBoostEvent,
}: BoostPageProps) {
  const [busy, setBusy] = React.useState(false);
  const [local, setLocal] = React.useState(sponsorship);
  const [boostTimeLeft, setBoostTimeLeft] = React.useState<number | null>(null);
  const cooldown = useCooldown();

  React.useEffect(() => {
    setLocal(sponsorship);
  }, [sponsorship.usedBoosts, sponsorship.totalBoosts, sponsorship.boostedAt]);

  // Calculate boost time remaining (24 hours)
  React.useEffect(() => {
    if (!local.boostedAt) {
      setBoostTimeLeft(null);
      return;
    }

    const updateTimeLeft = () => {
      const boostedTime = new Date(local.boostedAt!).getTime();
      const now = Date.now();
      const elapsed = now - boostedTime;
      const remaining = 24 * 60 * 60 * 1000 - elapsed;

      if (remaining <= 0) {
        setBoostTimeLeft(null);
      } else {
        setBoostTimeLeft(remaining);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [local.boostedAt]);

  const boostsLeft = Math.max(0, local.totalBoosts - local.usedBoosts);

  const doBoost = async () => {
    if (boostsLeft <= 0 || cooldown.isCooling('boost')) return;
    try {
      setBusy(true);
      await onBoostEvent?.(intentId);
      setLocal((s) => ({
        ...s,
        usedBoosts: s.usedBoosts + 1,
        boostedAt: new Date().toISOString(),
      }));
      cooldown.start('boost', 5);
    } finally {
      setBusy(false);
    }
  };

  const formatTimeLeft = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-xl dark:bg-indigo-900/30">
                <Rocket
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                  strokeWidth={2}
                />
              </div>
              <span className="truncate">Podbicia</span>
            </div>
            <div className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Szybkie wyniesienie w górę listingu wydarzeń. Podbicie trwa 24
              godziny od momentu aktywacji.
            </div>
          </div>
          <div className="shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {local.usedBoosts}/{local.totalBoosts}
          </div>
        </div>

        <QuotaBar used={local.usedBoosts} total={local.totalBoosts} />

        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Pozostało:{' '}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {boostsLeft}
          </span>
        </div>
      </div>

      {/* Boost Status */}
      {boostTimeLeft !== null && (
        <div className="rounded-[32px] border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <Sparkles
                className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                strokeWidth={2}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-emerald-900 dark:text-emerald-50">
                Aktywne podbicie
              </p>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                Wygasa za:{' '}
                <span className="font-mono font-bold">
                  {formatTimeLeft(boostTimeLeft)}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Boost Info */}
      {local.boostedAt && boostTimeLeft === null && (
        <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 shadow-sm p-6">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Ostatnie podbicie
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {new Date(local.boostedAt).toLocaleString('pl-PL', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}

      {/* Action Button */}
      <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
        <ActionButton
          label={
            cooldown.isCooling('boost')
              ? 'Odczekaj chwilę…'
              : 'Podbij wydarzenie'
          }
          icon={<Rocket className="w-4 h-4" strokeWidth={2} />}
          busyIcon={<Loader2 className="w-4 h-4 animate-spin" />}
          onClick={doBoost}
          disabled={boostsLeft <= 0 || busy}
          isCooling={cooldown.isCooling('boost')}
          cooldownSeconds={cooldown.get('boost')}
        />
      </div>

      {/* Help Section */}
      <div className="rounded-[32px] border border-blue-200/80 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 shadow-sm p-6">
        <h3 className="mb-3 text-sm font-bold text-blue-900 dark:text-blue-50">
          Jak działają podbicia?
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>Wydarzenie pojawia się na szczycie listy</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>Efekt trwa 24 godziny</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>Możesz użyć kolejnego podbicia po wygaśnięciu</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
