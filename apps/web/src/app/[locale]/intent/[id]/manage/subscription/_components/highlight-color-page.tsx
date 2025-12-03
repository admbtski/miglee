'use client';

import {
  Calendar,
  Info,
  Loader2,
  MapPin,
  Palette,
  Search,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import * as React from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';

import { useCooldown } from '@/hooks/use-cooldown';
import { ActionButton } from './action-button';
import { SponsorshipState } from './subscription-panel-types';
import { HIGHLIGHT_PRESETS } from '@/lib/billing-constants';
import { getCardHighlightClasses } from '@/lib/utils/is-boost-active';

type HighlightColorPageProps = {
  intentId: string;
  sponsorship: SponsorshipState & {
    highlightColor?: string | null;
  };
  onUpdateHighlightColor?: (
    intentId: string,
    color: string | null
  ) => Promise<void> | void;
};

export function HighlightColorPage({
  intentId,
  sponsorship,
  onUpdateHighlightColor,
}: HighlightColorPageProps) {
  const [busy, setBusy] = React.useState(false);
  const [local, setLocal] = React.useState(sponsorship);
  const cooldown = useCooldown();

  const [selectedColor, setSelectedColor] = React.useState<string>(
    sponsorship.highlightColor || HIGHLIGHT_PRESETS[0].hex
  );
  const [showCustomPicker, setShowCustomPicker] = React.useState(false);
  const [customColorInput, setCustomColorInput] = React.useState(
    sponsorship.highlightColor || HIGHLIGHT_PRESETS[0].hex
  );

  React.useEffect(() => {
    setLocal(sponsorship);
    if (sponsorship.highlightColor) {
      setSelectedColor(sponsorship.highlightColor);
      setCustomColorInput(sponsorship.highlightColor);
    }
  }, [sponsorship.highlightColor]);

  const updateColor = async () => {
    if (cooldown.isCooling('color')) return;
    const colorToSave = showCustomPicker ? customColorInput : selectedColor;

    if (showCustomPicker && !/^#[0-9A-F]{6}$/i.test(customColorInput)) {
      toast.error('Nieprawidłowy format koloru HEX. Użyj formatu #RRGGBB.');
      return;
    }

    try {
      setBusy(true);
      await onUpdateHighlightColor?.(intentId, colorToSave);
      setLocal((s) => ({ ...s, highlightColor: colorToSave }));
      cooldown.start('color', 5);
      toast.success('Kolor wyróżnienia został zaktualizowany');
    } finally {
      setBusy(false);
    }
  };

  const removeColor = async () => {
    if (cooldown.isCooling('color')) return;
    try {
      setBusy(true);
      await onUpdateHighlightColor?.(intentId, null);
      setSelectedColor(HIGHLIGHT_PRESETS[0].hex);
      setCustomColorInput(HIGHLIGHT_PRESETS[0].hex);
      setShowCustomPicker(false);
      setLocal((s) => ({ ...s, highlightColor: null }));
      cooldown.start('color', 5);
      toast.success('Kolor wyróżnienia został usunięty');
    } finally {
      setBusy(false);
    }
  };

  const handleCustomColorChange = (newColor: string) => {
    setCustomColorInput(newColor);
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      setSelectedColor(newColor);
    }
  };

  // Get highlight ring classes for preview
  const highlightRing = React.useMemo(
    () => getCardHighlightClasses(selectedColor, true),
    [selectedColor]
  );

  return (
    <div className="space-y-6">
      {/* Header with info about what this is for */}
      <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                <Sparkles
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                  strokeWidth={2}
                />
              </div>
              <span className="truncate">Kolor wyróżnienia</span>
            </div>
            <div className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Ustaw kolor ramki, który wyróżni Twoje wydarzenie wizualnie w
              wyszukiwarce i na liście wydarzeń.
            </div>
          </div>
          <div className="shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {local.highlightColor ? 'Ustawiony' : 'Domyślny'}
          </div>
        </div>

        {/* Info box about what this feature does */}
        <div className="flex items-start gap-3 p-4 mt-4 border rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Search className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Wyróżnienie w wyszukiwarce
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              Kolor ramki to wizualne wyróżnienie Twojego wydarzenia. Gdy
              użytkownicy przeglądają listę wydarzeń, Twoje wydarzenie będzie
              miało kolorową ramkę i efekt świecenia, co przyciągnie ich uwagę.
            </p>
          </div>
        </div>
      </div>

      {/* Main layout - desktop: config left, preview right; mobile: preview top, config bottom */}
      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Left column - Configuration */}
        <div className="flex-1 space-y-6 order-2 xl:order-1">
          {/* Preset Colors */}
          <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
            <h3 className="mb-4 text-sm font-bold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
              Kolory predefiniowane
            </h3>
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
                    disabled={busy}
                    className={clsx(
                      'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                      'hover:scale-105 active:scale-95',
                      isSelected && !showCustomPicker
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-[#10121a]'
                        : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20',
                      busy && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-full shadow-lg ring-2 ring-white/50 dark:ring-black/50"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 text-center leading-tight">
                      {preset.name}
                    </span>
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
          <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
            <button
              type="button"
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              disabled={busy}
              className={clsx(
                'flex items-center gap-3 w-full p-4 rounded-xl border-2 transition-all text-left',
                'hover:border-zinc-300 dark:hover:border-white/20',
                showCustomPicker
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'border-zinc-200 dark:border-white/10',
                busy && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
                <Palette className="w-6 h-6 text-zinc-600 dark:text-zinc-300" />
              </div>

              <div className="flex-1">
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Własny kolor
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
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

            {showCustomPicker && (
              <div className="p-4 mt-4 space-y-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <input
                      type="color"
                      value={customColorInput}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      disabled={busy}
                      className="w-20 h-20 border-2 border-white shadow-lg cursor-pointer rounded-xl dark:border-zinc-800"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      Kod HEX
                    </label>
                    <input
                      type="text"
                      value={customColorInput}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      placeholder="#f59e0b"
                      disabled={busy}
                      className={clsx(
                        'w-full px-4 py-3 rounded-lg',
                        'border-2 border-zinc-200 dark:border-white/10',
                        'bg-white dark:bg-zinc-900',
                        'text-sm font-mono text-zinc-900 dark:text-zinc-50',
                        'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
                        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    />
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
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

          {/* Action Buttons */}
          <div className="flex gap-3">
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
                  busy ||
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

            <button
              type="button"
              onClick={removeColor}
              disabled={
                busy || cooldown.isCooling('color') || !local.highlightColor
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

        {/* Right column - Preview (sticky on desktop, order-1 on mobile to show first) */}
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

            {/* Event Card Preview - styled like actual EventCard */}
            <div
              className={clsx(
                'relative w-full rounded-2xl p-4 flex flex-col gap-2',
                'ring-1 ring-white/5 dark:ring-white/5',
                'bg-white dark:bg-zinc-900',
                'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
                'select-none',
                'transition-all duration-500',
                highlightRing.className
              )}
              style={{
                ...highlightRing.style,
              }}
            >
              {/* Cover image area */}
              <div className="relative h-32 mb-3 -mx-4 -mt-4 overflow-hidden rounded-t-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20 flex items-center justify-center">
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
                      className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white shadow-sm select-none"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                    >
                      <Sparkles className="w-3 h-3" />
                      Promowane
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
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
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

            {/* Color indicator */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-zinc-200/50 dark:border-white/5">
              <div
                className="w-4 h-4 rounded-full shadow-sm ring-1 ring-white/50 dark:ring-black/50"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {selectedColor}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="rounded-[32px] border border-blue-200/80 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 shadow-sm p-6">
        <h3 className="mb-3 text-sm font-bold text-blue-900 dark:text-blue-50">
          Jak działa kolor wyróżnienia?
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>
              Kolor tworzy kolorową ramkę wokół karty Twojego wydarzenia w
              wynikach wyszukiwania
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>
              Jest to wizualne wyróżnienie, które przyciąga uwagę użytkowników
              przeglądających wydarzenia
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>
              Efekt podświetlenia jest najbardziej widoczny w trybie ciemnym
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>Możesz zmienić kolor w dowolnym momencie</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>Usunięcie koloru przywraca domyślny wygląd karty</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
