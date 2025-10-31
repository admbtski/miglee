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

import { CooldownRing } from '@/components/atoms/cooldown-ring';
import { QuotaBar } from '@/components/atoms/quota-bar';
import { ClickBurst } from '@/components/effects/click-burst';
import { ClickParticle } from '@/components/effects/click-particle';
import { Modal } from '@/components/modal/modal';
import { useCooldown } from '@/hooks/use-cooldown';
import {
  PLAN_CAPS,
  SponsorPlan,
  SponsorshipState,
} from './subscription-panel-types';
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
        glow && 'ring-2 ring-indigo-400/60 rounded-xl transition'
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isCooling || loading}
        className={clsx(
          'relative inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400/60',
          disabled || isCooling || loading
            ? 'cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
            : 'bg-indigo-600 text-white hover:bg-indigo-500'
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
  onToggleHighlight, // (intentId, enabled, tone?) — dodałem opcjonalny 3. argument
  onUpgradeSponsorshipPlan, // wykorzystane do "dokupienia" akcji
}: {
  intentId: string;
  sponsorship: SponsorshipState & {
    highlighted?: boolean;
    highlightTone?: HighlightTone; // <- nowy opcjonalny kolor wyróżnienia (jeśli już masz z backendu)
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
  onUpgradeSponsorshipPlan?: (
    intentId: string,
    newPlan: SponsorPlan
  ) => Promise<void> | void;
}) {
  const [busy, setBusy] = React.useState<
    'boost' | 'push' | 'badge' | 'highlight' | 'upgrade' | null
  >(null);
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);
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

  const caps = PLAN_CAPS[local.plan];
  const boostsLeft = Math.max(0, caps.boosts - local.usedBoosts);
  const pushesLeft = Math.max(0, caps.pushes - local.usedPushes);

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

  /** ---------------- PAKIETY DOKUPIENIA ---------------- */
  const PACKS: Record<
    SponsorPlan,
    { boosts: number; pushes: number; price: string; tone: string }
  > = {
    Basic: { boosts: 1, pushes: 1, price: '5 zł', tone: 'emerald' },
    Plus: { boosts: 3, pushes: 3, price: '10 zł', tone: 'indigo' },
    Pro: { boosts: 5, pushes: 5, price: '15 zł', tone: 'amber' },
  };

  const toneToClasses = (tone: string) => {
    switch (tone) {
      case 'emerald':
        return {
          card: 'border-emerald-300/60 bg-emerald-50/40 dark:border-emerald-700/50 dark:bg-emerald-900/10',
          title: 'text-emerald-900 dark:text-emerald-200',
          price: 'text-emerald-800 dark:text-emerald-200',
          button: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        };
      case 'indigo':
        return {
          card: 'border-indigo-300/60 bg-indigo-50/40 dark:border-indigo-700/50 dark:bg-indigo-900/10',
          title: 'text-indigo-900 dark:text-indigo-200',
          price: 'text-indigo-800 dark:text-indigo-200',
          button: 'bg-indigo-600 hover:bg-indigo-500 text-white',
        };
      case 'amber':
        return {
          card: 'border-amber-400/70 bg-amber-50/45 dark:border-amber-700/60 dark:bg-amber-900/10',
          title: 'text-amber-900 dark:text-amber-200',
          price: 'text-amber-800 dark:text-amber-200',
          button: 'bg-amber-600 hover:bg-amber-500 text-white',
        };
      default:
        return { card: '', title: '', price: '', button: '' };
    }
  };

  const handleBuyPack = async (plan: SponsorPlan) => {
    const inc = PACKS[plan];
    try {
      setBusy('upgrade');
      await onUpgradeSponsorshipPlan?.(intentId, plan);
      setLocal((s) => ({
        ...s,
        usedBoosts: Math.max(0, s.usedBoosts - inc.boosts),
        usedPushes: Math.max(0, s.usedPushes - inc.pushes),
      }));
      setUpgradeOpen(false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {/* --- główny layout --- */}
      <div className="grid gap-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm dark:border-zinc-800/40 dark:bg-zinc-900/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  {local.plan}
                </span>
                <h3 className="min-w-0 truncate text-[15px] font-semibold sm:text-base">
                  Pakiet sponsorowany aktywny
                </h3>
              </div>
              <p className="mt-1 text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
                Podbij wydarzenie, powiadom lokalnych użytkowników i steruj
                widocznością odznaki.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex shrink-0 items-center whitespace-nowrap rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              onClick={() => setUpgradeOpen(true)}
            >
              <CircleFadingArrowUpIcon className="mr-1 h-3.5 w-3.5" />
              Doładuj
            </button>
          </div>
        </div>

        {/* ACTION CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 sm:[grid-auto-rows:1fr]">
          {/* PODBICIA */}
          <div className="flex flex-col rounded-2xl border border-zinc-200/70 bg-white/60 p-4 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/40">
            <div className="grid grid-cols-[1fr_auto] items-start gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold leading-tight">
                  <Rocket className="h-4 w-4 shrink-0" />
                  <span className="truncate">Podbicia</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Szybkie wyniesienie w górę listingu.
                </div>
              </div>
              <div className="shrink-0 justify-self-end rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium dark:bg-zinc-800">
                {local.usedBoosts}/{caps.boosts}
              </div>
            </div>

            <QuotaBar used={local.usedBoosts} total={caps.boosts} />
            <div className="mt-2 text-xs">
              Pozostało: <b>{Math.max(0, caps.boosts - local.usedBoosts)}</b>
            </div>

            <div className="mt-auto pt-3">
              <ActionButton
                label={
                  cooldown.isCooling('boost') ? 'Chwilka…' : 'Podbij wydarzenie'
                }
                icon={<Rocket className="h-4 w-4" />}
                busyIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                onClick={doBoost}
                disabled={boostsLeft <= 0 || busy === 'boost'}
                isCooling={cooldown.isCooling('boost')}
                cooldownSeconds={cooldown.get('boost')}
              />
            </div>
          </div>

          {/* POWIADOM */}
          <div className="flex flex-col rounded-2xl border border-zinc-200/70 bg-white/60 p-4 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/40">
            <div className="grid grid-cols-[1fr_auto] items-start gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold leading-tight">
                  <Target className="h-4 w-4 shrink-0" />
                  <span className="truncate">Powiadom lokalnych</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Wyślij krótką informację do osób w okolicy.
                </div>
              </div>
              <div className="shrink-0 justify-self-end rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium dark:bg-zinc-800">
                {local.usedPushes}/{caps.pushes}
              </div>
            </div>

            <QuotaBar used={local.usedPushes} total={caps.pushes} />
            <div className="mt-2 text-xs">
              Pozostało: <b>{Math.max(0, caps.pushes - local.usedPushes)}</b>
            </div>

            <div className="mt-auto pt-3">
              <ActionButton
                label={
                  cooldown.isCooling('push')
                    ? 'Chwilka…'
                    : 'Wyślij powiadomienie'
                }
                icon={<Bell className="h-4 w-4" />}
                busyIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                onClick={doPush}
                disabled={pushesLeft <= 0 || busy === 'push'}
                isCooling={cooldown.isCooling('push')}
                cooldownSeconds={cooldown.get('push')}
              />
            </div>
          </div>

          {/* BADGE */}
          <div className="flex flex-col rounded-2xl border border-zinc-200/70 bg-white/60 p-4 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/40">
            <div className="grid grid-cols-[1fr_auto] items-start gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold leading-tight">
                  {local.badgeEnabled ? (
                    <Eye className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  <span className="truncate">Sponsored badge</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Kontroluj widoczność odznaki „Promowane”.
                </div>
              </div>
              <div
                className={clsx(
                  'justify-self-end rounded-md px-2 py-0.5 text-[11px] font-medium',
                  local.badgeEnabled
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                )}
              >
                {local.badgeEnabled ? 'Włączony' : 'Wyłączony'}
              </div>
            </div>

            <div className="mt-auto pt-3">
              <ActionButton
                label={local.badgeEnabled ? 'Wyłącz badge' : 'Włącz badge'}
                icon={
                  local.badgeEnabled ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
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
          <div className="flex flex-col rounded-2xl border border-zinc-200/70 bg-white/60 p-4 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/40">
            <div className="grid grid-cols-[1fr_auto] items-start gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold leading-tight">
                  {local.highlighted ? (
                    <Star
                      className={clsx('h-4 w-4', toneIconClass[highlightTone])}
                    />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                  <span className="truncate">Wyróżniony kafelek</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Nadaj kafelkowi wyróżniony wygląd i kolor akcentu.
                </div>
              </div>

              <div
                className={clsx(
                  'justify-self-end rounded-md px-2 py-0.5 text-[11px] font-medium',
                  local.highlighted
                    ? toneChipActiveClass[highlightTone]
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                )}
              >
                {local.highlighted ? 'Aktywny' : 'Wyłączony'}
              </div>
            </div>

            {/* selektor koloru */}
            <div className="mt-3 flex items-center gap-3">
              {(['emerald', 'indigo', 'amber'] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setHighlightTone(tone)}
                  className={clsx(
                    'h-6 w-6 rounded-full ring-2 transition-all',
                    toneDotRingClass[tone],
                    highlightTone === tone
                      ? 'ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-110'
                      : 'opacity-60'
                  )}
                  title={`Kolor ${tone}`}
                  aria-label={`Kolor ${tone}`}
                />
              ))}
            </div>

            <div className="mt-auto pt-3">
              <ActionButton
                label={
                  local.highlighted ? 'Wyłącz wyróżnienie' : 'Włącz wyróżnienie'
                }
                icon={
                  local.highlighted ? (
                    <StarOff className="h-4 w-4" />
                  ) : (
                    <Star
                      className={clsx('h-4 w-4', toneIconClass[highlightTone])}
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

      {/* ---------- MODAL: DOKUPIENIE AKCJI ---------- */}
      <Modal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        variant="default"
        density="compact"
        labelledById="topup-modal-title"
        ariaLabel="Dokup akcje"
        header={
          <div className="flex flex-col">
            <h3 id="topup-modal-title" className="text-lg font-semibold">
              Dokup akcje dla wydarzenia
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Wybierz pakiet, aby zwiększyć liczbę <b>Podbić</b> i{' '}
              <b>Push lokalnych</b>.
            </p>
          </div>
        }
        content={
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(PACKS) as SponsorPlan[]).map((plan) => {
              const { boosts, pushes, price, tone } = PACKS[plan];
              const t = toneToClasses(tone);

              const titles: Record<SponsorPlan, string> = {
                Basic: 'Dodatkowy impuls 🚀',
                Plus: 'Większy zasięg 🔊',
                Pro: 'Mocna promocja 💥',
              };

              const subtitles: Record<SponsorPlan, string> = {
                Basic:
                  'Szybkie podbicie i jeden lokalny push, idealne na start.',
                Plus: 'Więcej akcji dla aktywnych — podbij i przypomnij się częściej.',
                Pro: 'Największa moc widoczności: pięć podbić i pięć powiadomień.',
              };

              return (
                <div
                  key={plan}
                  className={clsx(
                    'flex flex-col rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md',
                    t.card
                  )}
                >
                  <div className={clsx('text-sm font-semibold', t.title)}>
                    {titles[plan]}
                  </div>
                  <div className={clsx('mb-2 text-2xl font-bold', t.price)}>
                    {price}
                  </div>

                  <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {subtitles[plan]}
                  </p>

                  <ul className="mb-4 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    <li>
                      <span className="font-medium text-zinc-800 dark:text-zinc-100">
                        Podbicia:
                      </span>{' '}
                      +{boosts}
                    </li>
                    <li>
                      <span className="font-medium text-zinc-800 dark:text-zinc-100">
                        Push lokalne:
                      </span>{' '}
                      +{pushes}
                    </li>
                  </ul>

                  <button
                    type="button"
                    className={clsx(
                      'mt-auto inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium',
                      t.button
                    )}
                    disabled={busy === 'upgrade'}
                    onClick={() => handleBuyPack(plan)}
                  >
                    {busy === 'upgrade' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Przetwarzanie…
                      </>
                    ) : (
                      <>Dokup</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        }
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setUpgradeOpen(false)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Powrót
            </button>
          </div>
        }
      />
    </>
  );
}
