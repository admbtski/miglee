'use client';

import {
  Calendar,
  Info,
  Loader2,
  MapPin,
  Paintbrush,
  Palette,
  Save,
  Users,
  Wand2,
} from 'lucide-react';
import * as React from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';

import { useCooldown } from '@/hooks/use-cooldown';
import { gqlClient } from '@/lib/api/client';
import {
  GradientPicker,
  generateGradientCSS,
  type GradientValue,
} from './gradient-picker';
import { GlowPicker, generateGlowCSS, type GlowValue } from './glow-picker';

/**
 * Appearance config structure
 */
export interface AppearanceConfig {
  card: {
    background: string | null;
    shadow: string | null;
  };
  detail: {
    background: string | null;
    panel: {
      background: string | null;
      shadow: string | null;
    };
  };
}

type AppearancePageProps = {
  intentId: string;
  initialConfig: AppearanceConfig;
};

// Preset backgrounds for cards
const CARD_BACKGROUND_PRESETS = [
  { id: 'none', name: 'Brak', value: null },
  {
    id: 'gradient-amber',
    name: 'Złoty gradient',
    value:
      'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.2))',
  },
  {
    id: 'gradient-blue',
    name: 'Niebieski gradient',
    value:
      'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.2))',
  },
  {
    id: 'gradient-purple',
    name: 'Fioletowy gradient',
    value:
      'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.2))',
  },
  {
    id: 'gradient-green',
    name: 'Zielony gradient',
    value: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.2))',
  },
];

// Preset shadows for cards
const CARD_SHADOW_PRESETS = [
  { id: 'none', name: 'Brak', value: null },
  {
    id: 'glow-amber',
    name: 'Złota poświata',
    value: '0 0 20px rgba(245,158,11,0.3), 0 0 40px rgba(245,158,11,0.15)',
  },
  {
    id: 'glow-blue',
    name: 'Niebieska poświata',
    value: '0 0 20px rgba(59,130,246,0.3), 0 0 40px rgba(59,130,246,0.15)',
  },
  {
    id: 'glow-purple',
    name: 'Fioletowa poświata',
    value: '0 0 20px rgba(168,85,247,0.3), 0 0 40px rgba(168,85,247,0.15)',
  },
  {
    id: 'glow-green',
    name: 'Zielona poświata',
    value: '0 0 20px rgba(34,197,94,0.3), 0 0 40px rgba(34,197,94,0.15)',
  },
];

type BackgroundMode = 'presets' | 'gradient';
type ShadowMode = 'presets' | 'creator';

export function AppearancePage({
  intentId,
  initialConfig,
}: AppearancePageProps) {
  const [busy, setBusy] = React.useState(false);
  const cooldown = useCooldown();

  // Local state for editing
  const [config, setConfig] = React.useState<AppearanceConfig>(initialConfig);

  // Background mode: presets or gradient creator
  const [backgroundMode, setBackgroundMode] =
    React.useState<BackgroundMode>('presets');

  // Shadow mode: presets or creator
  const [shadowMode, setShadowMode] = React.useState<ShadowMode>('presets');

  // Gradient state for background
  const [gradientValue, setGradientValue] = React.useState<GradientValue>({
    color1: '#f59e0b',
    color2: '#a855f7',
    direction: 'to-br',
  });

  // Glow state for shadow
  const [glowValue, setGlowValue] = React.useState<GlowValue>({
    color: '#f59e0b',
    intensity: 'normal',
  });

  // Apply gradient to config when gradient changes
  const handleGradientChange = (newGradient: GradientValue) => {
    setGradientValue(newGradient);
    const gradientCSS = generateGradientCSS(newGradient, 0.15);
    setConfig((c) => ({
      ...c,
      card: { ...c.card, background: gradientCSS },
    }));
  };

  // Apply glow to config when glow changes
  const handleGlowChange = (newGlow: GlowValue) => {
    setGlowValue(newGlow);
    const glowCSS = generateGlowCSS(newGlow);
    setConfig((c) => ({
      ...c,
      card: { ...c.card, shadow: glowCSS },
    }));
  };

  // Track if there are unsaved changes
  const hasChanges = React.useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(initialConfig);
  }, [config, initialConfig]);

  const handleSave = async () => {
    if (cooldown.isCooling('save')) return;

    try {
      setBusy(true);
      await gqlClient.request(
        /* GraphQL */ `
          mutation UpdateIntentAppearance(
            $input: UpdateIntentAppearanceInput!
          ) {
            updateIntentAppearance(input: $input) {
              id
              intentId
              config
              createdAt
              updatedAt
            }
          }
        `,
        {
          input: {
            intentId,
            card: {
              background: config.card.background,
              shadow: config.card.shadow,
            },
            detail: {
              background: config.detail.background,
              panel: {
                background: config.detail.panel.background,
                shadow: config.detail.panel.shadow,
              },
            },
          },
        }
      );
      cooldown.start('save', 5);
      toast.success('Wygląd został zapisany');
    } catch (error) {
      toast.error('Nie udało się zapisać wyglądu');
    } finally {
      setBusy(false);
    }
  };

  // Get preview styles
  const cardPreviewStyle = React.useMemo(() => {
    const style: React.CSSProperties = {};
    if (config.card.background) {
      style.background = config.card.background;
    }
    if (config.card.shadow) {
      style.boxShadow = config.card.shadow;
    }
    return style;
  }, [config.card]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30">
                <Paintbrush
                  className="w-6 h-6 text-violet-600 dark:text-violet-400"
                  strokeWidth={2}
                />
              </div>
              <span className="truncate">Wygląd wydarzenia</span>
            </div>
            <div className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Dostosuj wygląd karty wydarzenia w wyszukiwarce. Możesz ustawić
              tło, cień i inne efekty wizualne.
            </div>
          </div>
          {hasChanges && (
            <div className="shrink-0 rounded-lg bg-amber-100 dark:bg-amber-900/30 px-4 py-2 text-sm font-bold text-amber-700 dark:text-amber-300">
              Niezapisane zmiany
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 p-4 mt-4 border rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border-violet-200/50 dark:border-violet-800/30">
          <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <Info className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">
              Personalizacja wyglądu
            </p>
            <p className="mt-1 text-xs leading-relaxed text-violet-700 dark:text-violet-300">
              Te ustawienia pozwalają wyróżnić Twoje wydarzenie wizualnie.
              Zmiany będą widoczne na karcie wydarzenia w wynikach wyszukiwania
              i na liście wydarzeń.
            </p>
          </div>
        </div>
      </div>

      {/* Main layout - config left, preview right */}
      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Left column - Configuration */}
        <div className="flex-1 space-y-6 order-2 xl:order-1">
          {/* Card Section */}
          <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Karta wydarzenia
              </h3>
            </div>

            {/* Card Background */}
            <div className="space-y-4">
              <div>
                <label className="block mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Tło karty
                </label>

                {/* Mode Tabs */}
                <div className="flex gap-1 p-1 mb-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => setBackgroundMode('presets')}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all',
                      backgroundMode === 'presets'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    )}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    Presety
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackgroundMode('gradient')}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all',
                      backgroundMode === 'gradient'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    )}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Kreator
                  </button>
                </div>

                {/* Presets Mode */}
                {backgroundMode === 'presets' && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CARD_BACKGROUND_PRESETS.map((preset) => {
                      const isSelected =
                        config.card.background === preset.value;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setConfig((c) => ({
                              ...c,
                              card: { ...c.card, background: preset.value },
                            }))
                          }
                          disabled={busy}
                          className={clsx(
                            'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                            'hover:scale-[1.02] active:scale-[0.98]',
                            isSelected
                              ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-[#10121a]'
                              : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20',
                            busy && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <div
                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-white/10"
                            style={{
                              background:
                                preset.value ||
                                'linear-gradient(135deg, #f4f4f5, #e4e4e7)',
                            }}
                          />
                          <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 text-center leading-tight">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <div className="absolute flex items-center justify-center w-4 h-4 text-white bg-violet-600 rounded-full shadow-lg top-1 right-1">
                              <svg
                                className="w-2.5 h-2.5"
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
                )}

                {/* Gradient Creator Mode */}
                {backgroundMode === 'gradient' && (
                  <div className="p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/50 dark:border-white/5">
                    <GradientPicker
                      value={gradientValue}
                      onChange={handleGradientChange}
                      disabled={busy}
                      opacity={0.15}
                    />
                  </div>
                )}
              </div>

              {/* Card Shadow */}
              <div className="pt-4 border-t border-zinc-200/50 dark:border-white/5">
                <label className="block mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Cień / Poświata
                </label>

                {/* Shadow Mode Tabs */}
                <div className="flex gap-1 p-1 mb-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => setShadowMode('presets')}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all',
                      shadowMode === 'presets'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    )}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    Presety
                  </button>
                  <button
                    type="button"
                    onClick={() => setShadowMode('creator')}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all',
                      shadowMode === 'creator'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    )}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Kreator
                  </button>
                </div>

                {/* Presets Mode */}
                {shadowMode === 'presets' && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CARD_SHADOW_PRESETS.map((preset) => {
                      const isSelected = config.card.shadow === preset.value;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setConfig((c) => ({
                              ...c,
                              card: { ...c.card, shadow: preset.value },
                            }))
                          }
                          disabled={busy}
                          className={clsx(
                            'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                            'hover:scale-[1.02] active:scale-[0.98]',
                            isSelected
                              ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-[#10121a]'
                              : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20',
                            busy && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <div
                            className="w-full h-8 rounded-lg bg-white dark:bg-zinc-800"
                            style={{
                              boxShadow: preset.value || 'none',
                            }}
                          />
                          <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 text-center leading-tight">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <div className="absolute flex items-center justify-center w-4 h-4 text-white bg-violet-600 rounded-full shadow-lg top-1 right-1">
                              <svg
                                className="w-2.5 h-2.5"
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
                )}

                {/* Glow Creator Mode */}
                {shadowMode === 'creator' && (
                  <div className="p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/50 dark:border-white/5">
                    <GlowPicker
                      value={glowValue}
                      onChange={handleGlowChange}
                      disabled={busy}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !hasChanges || cooldown.isCooling('save')}
            className={clsx(
              'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-base transition-all',
              'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700',
              'text-white shadow-lg shadow-violet-500/25',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
              'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-[#10121a]'
            )}
          >
            {busy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {cooldown.isCooling('save')
              ? 'Odczekaj chwilę…'
              : hasChanges
                ? 'Zapisz zmiany'
                : 'Brak zmian do zapisania'}
          </button>
        </div>

        {/* Right column - Preview */}
        <div className="w-full xl:w-[380px] xl:flex-shrink-0 xl:sticky xl:top-6 xl:self-start order-1 xl:order-2">
          <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-bold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
                Podgląd karty wydarzenia
              </h3>
              <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                <Info className="w-3 h-3" />
                Wyszukiwarka
              </div>
            </div>

            {/* Event Card Preview */}
            <div
              className={clsx(
                'relative w-full rounded-2xl p-4 flex flex-col gap-2',
                'ring-1 ring-white/5 dark:ring-white/5',
                'bg-white dark:bg-zinc-900',
                'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
                'select-none',
                'transition-all duration-500'
              )}
              style={cardPreviewStyle}
            >
              {/* Cover image area */}
              <div className="relative h-32 mb-3 -mx-4 -mt-4 overflow-hidden rounded-t-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                <div className="w-full h-full bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/20 dark:to-fuchsia-900/20 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-zinc-400 dark:text-zinc-600 opacity-40" />
                </div>

                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/0 to-black/40" />

                {/* Badges */}
                <div className="absolute z-10 top-3 left-3 right-12">
                  <div className="flex flex-wrap gap-1">
                    <span
                      className="inline-flex items-center rounded-full bg-emerald-500/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white shadow-sm select-none"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                    >
                      Za 3 dni
                    </span>
                    <span
                      className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white shadow-sm select-none"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                    >
                      Sport
                    </span>
                  </div>
                </div>

                {/* Organizer */}
                <div className="absolute z-10 bottom-3 left-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500" />
                    <span
                      className="text-[10px] font-normal text-white/80 leading-tight"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                    >
                      Organizator
                    </span>
                  </div>
                </div>
              </div>

              {/* Favourite button placeholder */}
              <div className="absolute top-2 right-2 z-[2]">
                <div className="w-7 h-7 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white/70"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold leading-tight text-zinc-900 dark:text-white line-clamp-2">
                  Przykładowe wydarzenie
                </h3>

                <div className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center min-w-0 gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="text-[11px] truncate">
                      Warszawa, Polska
                    </span>
                  </div>

                  <div className="flex items-center gap-1 truncate">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="text-[11px] truncate">
                      15 gru 2025, 18:00 • 2h
                    </span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <Users className="h-3 w-3 flex-shrink-0" />
                    <span className="text-[11px] truncate">5 / 20 osób</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current settings indicator */}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-200/50 dark:border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Tło:</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                  {config.card.background || 'domyślne'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Cień:</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                  {config.card.shadow || 'domyślny'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="rounded-[32px] border border-blue-200/80 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 shadow-sm p-6">
        <h3 className="mb-3 text-sm font-bold text-blue-900 dark:text-blue-50">
          Jak działa personalizacja wyglądu?
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>
              Ustawienia wyglądu pozwalają wyróżnić Twoje wydarzenie w
              wyszukiwarce
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>
              Możesz użyć predefiniowanych stylów lub wpisać własne wartości CSS
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>
              Obsługiwane formaty: kolory HEX, RGB, RGBA, gradienty CSS,
              box-shadow
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>
              Zmiany są widoczne natychmiast w podglądzie, ale musisz je zapisać
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>Możesz zmienić ustawienia w dowolnym momencie</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
