'use client';

import {
  Bell,
  CircleFadingArrowUpIcon,
  Eye,
  EyeOff,
  Loader2,
  Rocket,
  Sparkles,
  Star,
  StarOff,
  Target,
} from 'lucide-react';
import * as React from 'react';

import { CooldownRing } from '@/components/ui/cooldown-ring';
import { QuotaBar } from '@/components/ui/quota-bar';
import { ClickBurst } from '@/components/ui/click-burst';
import { ClickParticle } from '@/components/ui/click-particle';
import { useCooldown } from '@/hooks/use-cooldown';
import { SponsorPlan, SponsorshipState } from './subscription-panel-types';
import clsx from 'clsx';

/** ---------- Unified ActionButton ---------- */
function ActionButton({
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
            ? (busyIcon ?? <Loader2 className="h-4 w-4 animate-spin" />)
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

/** ---------- helpers (tone) ---------- */
type HighlightTone = 'emerald' | 'indigo' | 'amber';

const toneIconClass: Record<HighlightTone, string> = {
  emerald: 'text-emerald-500',
  indigo: 'text-indigo-500',
  amber: 'text-amber-500',
};

const toneChipActiveClass: Record<HighlightTone, string> = {
  emerald:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  indigo:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
};

const toneDotRingClass: Record<HighlightTone, string> = {
  emerald: 'bg-emerald-500 ring-emerald-400',
  indigo: 'bg-indigo-500 ring-indigo-400',
  amber: 'bg-amber-500 ring-amber-400',
};

/** ---------- MAIN COMPONENT ---------- */
export function SubscriptionPanel({
  intentId,
  sponsorship,
  onBoostEvent,
  onSendLocalPush,
  onToggleSponsoredBadge,
  onToggleHighlight,
  onReloadActions,
}: {
  intentId: string;
  sponsorship: SponsorshipState & {
    highlighted?: boolean;
    highlightTone?: HighlightTone;
    subscriptionPlan?: SponsorPlan | 'None';
  };
  onBoostEvent?: (intentId: string) => Promise<void> | void;
  onSendLocalPush?: (intentId: string) => Promise<void> | void;
  onToggleSponsoredBadge?: (
    intentId: string,
    enabled: boolean
  ) => Promise<void> | void;
  onToggleHighlight?: (
    intentId: string,
    enabled: boolean,
    tone?: HighlightTone
  ) => Promise<void> | void;
  onReloadActions?: () => void;
}) {
  const [busy, setBusy] = React.useState<
    'boost' | 'push' | 'badge' | 'highlight' | null
  >(null);
  const [local, setLocal] = React.useState(sponsorship);

  // tone (kolor wyróżnienia)
  const [highlightTone, setHighlightTone] = React.useState<HighlightTone>(
    sponsorship.highlightTone ?? 'indigo'
  );

  const cooldown = useCooldown();

  React.useEffect(() => {
    setLocal(sponsorship);
    if (sponsorship.highlightTone) setHighlightTone(sponsorship.highlightTone);
  }, [
    sponsorship.plan,
    sponsorship.usedBoosts,
    sponsorship.usedPushes,
    sponsorship.badgeEnabled,
    sponsorship.highlighted,
    sponsorship.highlightTone,
  ]);

  const boostsLeft = Math.max(0, local.totalBoosts - local.usedBoosts);
  const pushesLeft = Math.max(0, local.totalPushes - local.usedPushes);

  const startActionCooldown = (
    key: 'boost' | 'push' | 'badge' | 'highlight'
  ) => {
    cooldown.start(key, 5);
  };

  const doBoost = async () => {
    if (boostsLeft <= 0 || cooldown.isCooling('boost')) return;
    try {
      setBusy('boost');
      await onBoostEvent?.(intentId);
      setLocal((s) => ({ ...s, usedBoosts: s.usedBoosts + 1 }));
      startActionCooldown('boost');
    } finally {
      setBusy(null);
    }
  };

  const doPush = async () => {
    if (pushesLeft <= 0 || cooldown.isCooling('push')) return;
    try {
      setBusy('push');
      await onSendLocalPush?.(intentId);
      setLocal((s) => ({ ...s, usedPushes: s.usedPushes + 1 }));
      startActionCooldown('push');
    } finally {
      setBusy(null);
    }
  };

  const toggleBadge = async () => {
    if (cooldown.isCooling('badge')) return;
    try {
      setBusy('badge');
      const next = !local.badgeEnabled;
      await onToggleSponsoredBadge?.(intentId, next);
      setLocal((s) => ({ ...s, badgeEnabled: next }));
      startActionCooldown('badge');
    } finally {
      setBusy(null);
    }
  };

  const toggleHighlight = async () => {
    if (cooldown.isCooling('highlight')) return;
    try {
      setBusy('highlight');
      const next = !local.highlighted;
      await onToggleHighlight?.(intentId, next, highlightTone);
      setLocal((s) => ({ ...s, highlighted: next, highlightTone }));
      startActionCooldown('highlight');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {/* --- główny layout --- */}
      <div className="space-y-6">
        {/* Header Card */}
        <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
          <div className="flex flex-col gap-4">
            {/* Title and badge */}
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={clsx(
                    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white shadow-md',
                    local.plan === 'Pro'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                      : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                  )}
                >
                  <Sparkles className="h-4 w-4" strokeWidth={2} />
                  {local.plan}
                </span>
                <h3 className="min-w-0 truncate text-lg font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
                  Aktywny plan sponsorowania
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-[70ch]">
                Ten plan obowiązuje do końca cyklu życia wydarzenia.
                {local.plan === 'Plus' &&
                  ' Możesz dokupić akcje lub ulepszyć do Pro.'}
                {local.plan === 'Pro' && ' Możesz dokupić dodatkowe akcje.'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Upgrade button (only for Plus users) */}
              {local.plan === 'Plus' && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 shadow-md"
                  onClick={() => {
                    // TODO: Navigate to upgrade flow
                    window.location.href = `/intent/${intentId}/manage/plans`;
                  }}
                >
                  <CircleFadingArrowUpIcon
                    className="h-4 w-4"
                    strokeWidth={2}
                  />
                  Ulepsz do Pro
                </button>
              )}

              {/* Reload actions button */}
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-5 py-2.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                onClick={onReloadActions}
              >
                <CircleFadingArrowUpIcon className="h-4 w-4" strokeWidth={2} />
                Doładuj akcje
              </button>
            </div>
          </div>
        </div>

        {/* ACTION CARDS */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* PODBICIA */}
          <div className="flex flex-col rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Rocket
                      className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                      strokeWidth={2}
                    />
                  </div>
                  <span className="truncate">Podbicia</span>
                </div>
                <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Szybkie wyniesienie w górę listingu wydarzeń.
                </div>
              </div>
              <div className="shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {local.usedBoosts}/{local.totalBoosts}
              </div>
            </div>

            <QuotaBar used={local.usedBoosts} total={local.totalBoosts} />
            <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Pozostało:{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {boostsLeft}
              </span>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-white/5">
              <ActionButton
                label={
                  cooldown.isCooling('boost')
                    ? 'Odczekaj chwilę…'
                    : 'Podbij wydarzenie'
                }
                icon={<Rocket className="h-4 w-4" strokeWidth={2} />}
                busyIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                onClick={doBoost}
                disabled={boostsLeft <= 0 || busy === 'boost'}
                isCooling={cooldown.isCooling('boost')}
                cooldownSeconds={cooldown.get('boost')}
              />
            </div>
          </div>

          {/* POWIADOM */}
          <div className="flex flex-col rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Target
                      className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                      strokeWidth={2}
                    />
                  </div>
                  <span className="truncate">Push lokalny</span>
                </div>
                <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Wyślij powiadomienie do użytkowników w okolicy.
                </div>
              </div>
              <div className="shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {local.usedPushes}/{local.totalPushes}
              </div>
            </div>

            <QuotaBar used={local.usedPushes} total={local.totalPushes} />
            <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Pozostało:{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {pushesLeft}
              </span>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-white/5">
              <ActionButton
                label={
                  cooldown.isCooling('push')
                    ? 'Odczekaj chwilę…'
                    : 'Wyślij powiadomienie'
                }
                icon={<Bell className="h-4 w-4" strokeWidth={2} />}
                busyIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                onClick={doPush}
                disabled={pushesLeft <= 0 || busy === 'push'}
                isCooling={cooldown.isCooling('push')}
                cooldownSeconds={cooldown.get('push')}
              />
            </div>
          </div>

          {/* BADGE */}
          <div className="flex flex-col rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  <div
                    className={clsx(
                      'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                      local.badgeEnabled
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-zinc-100 dark:bg-zinc-800'
                    )}
                  >
                    {local.badgeEnabled ? (
                      <Eye
                        className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                        strokeWidth={2}
                      />
                    ) : (
                      <EyeOff
                        className="h-5 w-5 text-zinc-500 dark:text-zinc-400"
                        strokeWidth={2}
                      />
                    )}
                  </div>
                  <span className="truncate">Odznaka sponsora</span>
                </div>
                <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Kontroluj widoczność odznaki „Promowane".
                </div>
              </div>
              <div
                className={clsx(
                  'shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold',
                  local.badgeEnabled
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                )}
              >
                {local.badgeEnabled ? 'Włączony' : 'Wyłączony'}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-white/5">
              <ActionButton
                label={local.badgeEnabled ? 'Wyłącz odznakę' : 'Włącz odznakę'}
                icon={
                  local.badgeEnabled ? (
                    <EyeOff className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={2} />
                  )
                }
                busyIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                onClick={toggleBadge}
                disabled={busy === 'badge'}
                isCooling={cooldown.isCooling('badge')}
                cooldownSeconds={cooldown.get('badge')}
              />
            </div>
          </div>

          {/* WYRÓŻNIONY KAFELEK + WYBÓR KOLORU */}
          <div className="flex flex-col rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  <div
                    className={clsx(
                      'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                      local.highlighted
                        ? toneIconClass[highlightTone].includes('emerald')
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : toneIconClass[highlightTone].includes('indigo')
                            ? 'bg-indigo-100 dark:bg-indigo-900/30'
                            : 'bg-amber-100 dark:bg-amber-900/30'
                        : 'bg-zinc-100 dark:bg-zinc-800'
                    )}
                  >
                    {local.highlighted ? (
                      <Star
                        className={clsx(
                          'h-5 w-5',
                          toneIconClass[highlightTone]
                        )}
                        strokeWidth={2}
                      />
                    ) : (
                      <StarOff
                        className="h-5 w-5 text-zinc-500 dark:text-zinc-400"
                        strokeWidth={2}
                      />
                    )}
                  </div>
                  <span className="truncate">Wyróżniony kafelek</span>
                </div>
                <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Nadaj kafelkowi wyróżniony wygląd i kolor.
                </div>
              </div>

              <div
                className={clsx(
                  'shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold',
                  local.highlighted
                    ? toneChipActiveClass[highlightTone]
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                )}
              >
                {local.highlighted ? 'Aktywny' : 'Wyłączony'}
              </div>
            </div>

            {/* selektor koloru */}
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-200 dark:border-white/5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Kolor:
              </span>
              {(['emerald', 'indigo', 'amber'] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setHighlightTone(tone)}
                  className={clsx(
                    'h-7 w-7 rounded-full ring-2 transition-all',
                    toneDotRingClass[tone],
                    highlightTone === tone
                      ? 'ring-offset-2 ring-offset-white dark:ring-offset-[#10121a] scale-110'
                      : 'opacity-50 hover:opacity-80'
                  )}
                  title={`Kolor ${tone}`}
                  aria-label={`Kolor ${tone}`}
                />
              ))}
            </div>

            <div className="mt-4">
              <ActionButton
                label={
                  local.highlighted ? 'Wyłącz wyróżnienie' : 'Włącz wyróżnienie'
                }
                icon={
                  local.highlighted ? (
                    <StarOff className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <Star
                      className={clsx('h-4 w-4', toneIconClass[highlightTone])}
                      strokeWidth={2}
                    />
                  )
                }
                busyIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                onClick={toggleHighlight}
                disabled={busy === 'highlight'}
                isCooling={cooldown.isCooling('highlight')}
                cooldownSeconds={cooldown.get('highlight')}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
