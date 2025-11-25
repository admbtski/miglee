'use client';

import {
  Bell,
  CircleFadingArrowUpIcon,
  Loader2,
  Palette,
  Rocket,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { CooldownRing } from '@/components/ui/cooldown-ring';
import { QuotaBar } from '@/components/ui/quota-bar';
import { ClickBurst } from '@/components/ui/click-burst';
import { ClickParticle } from '@/components/ui/click-particle';
import { useCooldown } from '@/hooks/use-cooldown';
import { SponsorPlan, SponsorshipState } from './subscription-panel-types';
import { HIGHLIGHT_PRESETS } from '@/lib/billing-constants';
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

/** ---------- MAIN COMPONENT ---------- */
export function SubscriptionPanel({
  intentId,
  sponsorship,
  onBoostEvent,
  onSendLocalPush,
  onUpdateHighlightColor,
  onReloadActions,
}: {
  intentId: string;
  sponsorship: SponsorshipState & {
    highlightColor?: string | null; // HEX color (optional for backwards compat)
    boostedAt?: string | null; // ISO timestamp of last boost
    subscriptionPlan?: SponsorPlan | 'None';
  };
  onBoostEvent?: (intentId: string) => Promise<void> | void;
  onSendLocalPush?: (intentId: string) => Promise<void> | void;
  onUpdateHighlightColor?: (
    intentId: string,
    color: string | null
  ) => Promise<void> | void;
  onReloadActions?: () => void;
}) {
  const [busy, setBusy] = React.useState<'boost' | 'push' | 'color' | null>(
    null
  );
  const [local, setLocal] = React.useState(sponsorship);

  // Selected highlight color (HEX)
  const [selectedColor, setSelectedColor] = React.useState<string>(
    sponsorship.highlightColor || HIGHLIGHT_PRESETS[0].hex
  );

  // Custom color picker state
  const [showCustomPicker, setShowCustomPicker] = React.useState(false);
  const [customColorInput, setCustomColorInput] = React.useState(
    sponsorship.highlightColor || HIGHLIGHT_PRESETS[0].hex
  );

  // Boost countdown state
  const [boostTimeLeft, setBoostTimeLeft] = React.useState<number | null>(null);

  const cooldown = useCooldown();

  React.useEffect(() => {
    setLocal(sponsorship);
    if (sponsorship.highlightColor) {
      setSelectedColor(sponsorship.highlightColor);
      setCustomColorInput(sponsorship.highlightColor);
    }
  }, [
    sponsorship.plan,
    sponsorship.usedBoosts,
    sponsorship.usedPushes,
    sponsorship.highlightColor,
    sponsorship.boostedAt,
  ]);

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
      const remaining = 24 * 60 * 60 * 1000 - elapsed; // 24 hours in ms

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
  const pushesLeft = Math.max(0, local.totalPushes - local.usedPushes);

  const startActionCooldown = (key: 'boost' | 'push' | 'color') => {
    cooldown.start(key, 5);
  };

  const doBoost = async () => {
    if (boostsLeft <= 0 || cooldown.isCooling('boost')) return;
    try {
      setBusy('boost');
      await onBoostEvent?.(intentId);
      setLocal((s) => ({
        ...s,
        usedBoosts: s.usedBoosts + 1,
        boostedAt: new Date().toISOString(),
      }));
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

  const updateColor = async () => {
    if (cooldown.isCooling('color')) return;
    const colorToSave = showCustomPicker ? customColorInput : selectedColor;

    // Validate custom color if in custom mode
    if (showCustomPicker && !/^#[0-9A-F]{6}$/i.test(customColorInput)) {
      toast.error('Nieprawidłowy format koloru HEX. Użyj formatu #RRGGBB.');
      return;
    }

    try {
      setBusy('color');
      await onUpdateHighlightColor?.(intentId, colorToSave);
      setLocal((s) => ({ ...s, highlightColor: colorToSave }));
      startActionCooldown('color');
    } finally {
      setBusy(null);
    }
  };

  const removeColor = async () => {
    if (cooldown.isCooling('color')) return;
    try {
      setBusy('color');
      // Pass null to completely remove the highlight color
      await onUpdateHighlightColor?.(intentId, null);
      setSelectedColor(HIGHLIGHT_PRESETS[0].hex);
      setCustomColorInput(HIGHLIGHT_PRESETS[0].hex);
      setShowCustomPicker(false);
      setLocal((s) => ({ ...s, highlightColor: null }));
      startActionCooldown('color');
    } finally {
      setBusy(null);
    }
  };

  const handleCustomColorChange = (newColor: string) => {
    setCustomColorInput(newColor);
    // Only update selected color if it's a valid HEX
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      setSelectedColor(newColor);
    }
  };

  // Format remaining time for boost countdown
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
    <>
      {/* --- główny layout --- */}
      <div className="space-y-6">
        {/* Header Card */}
        <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
          <div className="flex flex-col gap-4">
            {/* Title and badge */}
            <div className="min-w-0">
              <div className="flex items-center min-w-0 gap-3">
                <span
                  className={clsx(
                    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white shadow-md',
                    local.plan === 'Pro'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                      : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                  )}
                >
                  <Sparkles className="w-4 h-4" strokeWidth={2} />
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
                    className="w-4 h-4"
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
                <CircleFadingArrowUpIcon className="w-4 h-4" strokeWidth={2} />
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
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-xl dark:bg-indigo-900/30">
                    <Rocket
                      className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                      strokeWidth={2}
                    />
                  </div>
                  <span className="truncate">Podbicia</span>
                </div>
                <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Szybkie wyniesienie w górę listingu wydarzeń.
                </div>
              </div>
              <div className="shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {local.usedBoosts}/{local.totalBoosts}
              </div>
            </div>

            <QuotaBar used={local.usedBoosts} total={local.totalBoosts} />

            <div className="mt-3 space-y-2">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Pozostało:{' '}
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {boostsLeft}
                </span>
              </div>

              {/* Boost Countdown */}
              {boostTimeLeft !== null && (
                <div className="flex items-center gap-2 p-3 border rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                    <Sparkles
                      className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                      strokeWidth={2}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-50">
                      Aktywne podbicie
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Wygasa za:{' '}
                      <span className="font-mono font-bold">
                        {formatTimeLeft(boostTimeLeft)}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {local.boostedAt && boostTimeLeft === null && (
                <div className="p-3 border rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Ostatnie podbicie:{' '}
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
            </div>

            <div className="pt-4 mt-6 border-t border-zinc-200 dark:border-white/5">
              <ActionButton
                label={
                  cooldown.isCooling('boost')
                    ? 'Odczekaj chwilę…'
                    : 'Podbij wydarzenie'
                }
                icon={<Rocket className="w-4 h-4" strokeWidth={2} />}
                busyIcon={<Loader2 className="w-4 h-4 animate-spin" />}
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
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Target
                      className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                      strokeWidth={2}
                    />
                  </div>
                  <span className="truncate">Push lokalny</span>
                </div>
                <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
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

            <div className="pt-4 mt-6 border-t border-zinc-200 dark:border-white/5">
              <ActionButton
                label={
                  cooldown.isCooling('push')
                    ? 'Odczekaj chwilę…'
                    : 'Wyślij powiadomienie'
                }
                icon={<Bell className="w-4 h-4" strokeWidth={2} />}
                busyIcon={<Loader2 className="w-4 h-4 animate-spin" />}
                onClick={doPush}
                disabled={pushesLeft <= 0 || busy === 'push'}
                isCooling={cooldown.isCooling('push')}
                cooldownSeconds={cooldown.get('push')}
              />
            </div>
          </div>

          {/* WYRÓŻNIONY KAFELEK + WYBÓR KOLORU */}
          <div className="flex flex-col rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                    <Sparkles
                      className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                      strokeWidth={2}
                    />
                  </div>
                  <span className="truncate">Kolor wyróżnienia</span>
                </div>
                <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Wybierz kolor ramki dla promowanego wydarzenia.
                </div>
              </div>

              <div className="shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {local.highlightColor ? 'Ustawiony' : 'Domyślny'}
              </div>
            </div>

            {/* Selektor kolorów z 4 presetów */}
            <div className="pb-4 border-b border-zinc-200 dark:border-white/5">
              <span className="block mb-3 text-xs font-medium tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
                Kolory predefiniowane:
              </span>
              <div className="grid grid-cols-4 gap-3">
                {HIGHLIGHT_PRESETS.map((preset) => {
                  const isSelected =
                    selectedColor.toLowerCase() === preset.hex.toLowerCase();

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedColor(preset.hex);
                        setCustomColorInput(preset.hex);
                        setShowCustomPicker(false);
                      }}
                      disabled={busy === 'color'}
                      className={clsx(
                        'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                        'hover:scale-105 active:scale-95',
                        isSelected && !showCustomPicker
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-[#10121a]'
                          : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20',
                        busy === 'color' && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {/* Color Circle */}
                      <div
                        className="w-10 h-10 rounded-full shadow-lg ring-2 ring-white/50 dark:ring-black/50"
                        style={{ backgroundColor: preset.hex }}
                      />

                      {/* Color Name */}
                      <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 text-center leading-tight">
                        {preset.name}
                      </span>

                      {/* Selected Checkmark */}
                      {isSelected && !showCustomPicker && (
                        <div className="absolute flex items-center justify-center w-5 h-5 text-white bg-indigo-600 rounded-full shadow-lg top-1 right-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Picker */}
            <div className="pb-4 border-b border-zinc-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => setShowCustomPicker(!showCustomPicker)}
                disabled={busy === 'color'}
                className={clsx(
                  'flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all text-left',
                  'hover:border-zinc-300 dark:hover:border-white/20',
                  showCustomPicker
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                    : 'border-zinc-200 dark:border-white/10',
                  busy === 'color' && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
                  <Palette className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Własny kolor
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Wybierz dowolny kolor HEX
                  </p>
                </div>

                {showCustomPicker && (
                  <div className="flex items-center justify-center w-5 h-5 text-white bg-indigo-600 rounded-full shadow-lg">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>

              {/* Custom Color Input (Expanded) */}
              {showCustomPicker && (
                <div className="p-4 mt-3 space-y-3 border rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    {/* HTML5 Color Picker */}
                    <div className="relative flex-shrink-0">
                      <input
                        type="color"
                        value={customColorInput}
                        onChange={(e) =>
                          handleCustomColorChange(e.target.value)
                        }
                        disabled={busy === 'color'}
                        className="w-16 h-16 border-2 border-white shadow-lg cursor-pointer rounded-xl dark:border-zinc-800"
                      />
                    </div>

                    {/* HEX Input */}
                    <div className="flex-1">
                      <label className="block mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Kod HEX
                      </label>
                      <input
                        type="text"
                        value={customColorInput}
                        onChange={(e) =>
                          handleCustomColorChange(e.target.value)
                        }
                        placeholder="#f59e0b"
                        disabled={busy === 'color'}
                        className={clsx(
                          'w-full px-3 py-2 rounded-lg',
                          'border-2 border-zinc-200 dark:border-white/10',
                          'bg-white dark:bg-zinc-900',
                          'text-sm font-mono text-zinc-900 dark:text-zinc-50',
                          'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
                          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      />
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Wpisz kod w formacie #RRGGBB
                      </p>
                      {customColorInput &&
                        !/^#[0-9A-F]{6}$/i.test(customColorInput) && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            Nieprawidłowy format koloru
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="py-4 border-b border-zinc-200 dark:border-white/5">
              <span className="block mb-3 text-xs font-medium tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
                Podgląd:
              </span>
              <div
                className="relative w-full h-24 rounded-xl ring-2 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900"
                style={{
                  boxShadow: `0 0 0 2px ${selectedColor}33, 0 0 16px ${selectedColor}55, 0 0 48px ${selectedColor}33`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Twoje wydarzenie z wyróżnieniem
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <div className="flex-1">
                <ActionButton
                  label={
                    cooldown.isCooling('color')
                      ? 'Odczekaj chwilę…'
                      : 'Zapisz kolor'
                  }
                  icon={<Sparkles className="w-4 h-4" strokeWidth={2} />}
                  busyIcon={<Loader2 className="w-4 h-4 animate-spin" />}
                  onClick={updateColor}
                  disabled={
                    busy === 'color' ||
                    cooldown.isCooling('color') ||
                    (showCustomPicker
                      ? customColorInput === local.highlightColor
                      : selectedColor === local.highlightColor) ||
                    (showCustomPicker &&
                      !/^#[0-9A-F]{6}$/i.test(customColorInput))
                  }
                  isCooling={cooldown.isCooling('color')}
                  cooldownSeconds={cooldown.get('color')}
                />
              </div>

              {/* Remove Color Button */}
              <button
                type="button"
                onClick={removeColor}
                disabled={
                  busy === 'color' ||
                  cooldown.isCooling('color') ||
                  !local.highlightColor
                }
                title={
                  local.highlightColor
                    ? 'Usuń kolor wyróżnienia'
                    : 'Brak koloru do usunięcia'
                }
                className={clsx(
                  'flex items-center justify-center px-4 py-3 rounded-2xl transition-all',
                  'border-2 border-red-200 dark:border-red-800',
                  'bg-red-50 dark:bg-red-900/20',
                  'text-red-700 dark:text-red-300',
                  'hover:bg-red-100 dark:hover:bg-red-900/30',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-red-400/60'
                )}
              >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
