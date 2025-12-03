'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Preset colors for glow picker
const COLOR_PRESETS = [
  { id: 'amber', name: 'Złoty', hex: '#f59e0b' },
  { id: 'blue', name: 'Niebieski', hex: '#3b82f6' },
  { id: 'purple', name: 'Fioletowy', hex: '#a855f7' },
  { id: 'green', name: 'Zielony', hex: '#22c55e' },
  { id: 'rose', name: 'Różowy', hex: '#f43f5e' },
  { id: 'cyan', name: 'Cyjan', hex: '#06b6d4' },
  { id: 'orange', name: 'Pomarańcz', hex: '#f97316' },
  { id: 'indigo', name: 'Indygo', hex: '#6366f1' },
] as const;

// Glow intensity presets
const INTENSITY_PRESETS = [
  { id: 'subtle', name: 'Subtelna', multiplier: 0.5 },
  { id: 'normal', name: 'Normalna', multiplier: 1 },
  { id: 'strong', name: 'Mocna', multiplier: 1.5 },
  { id: 'intense', name: 'Intensywna', multiplier: 2 },
] as const;

type GlowIntensity = (typeof INTENSITY_PRESETS)[number]['id'];

interface GlowValue {
  color: string;
  intensity: GlowIntensity;
}

interface GlowPickerProps {
  value: GlowValue;
  onChange: (value: GlowValue) => void;
  disabled?: boolean;
}

/**
 * Generate CSS box-shadow string for glow effect
 */
export function generateGlowCSS(value: GlowValue): string {
  const intensity = INTENSITY_PRESETS.find((i) => i.id === value.intensity);
  const multiplier = intensity?.multiplier ?? 1;

  // Convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const innerGlow = hexToRgba(value.color, 0.3 * multiplier);
  const outerGlow = hexToRgba(value.color, 0.15 * multiplier);

  const innerSize = Math.round(20 * multiplier);
  const outerSize = Math.round(40 * multiplier);

  return `0 0 ${innerSize}px ${innerGlow}, 0 0 ${outerSize}px ${outerGlow}`;
}

export function GlowPicker({
  value,
  onChange,
  disabled = false,
}: GlowPickerProps) {
  const [showCustomColor, setShowCustomColor] = React.useState(false);

  const handleColorChange = (hex: string) => {
    onChange({ ...value, color: hex });
  };

  const handleIntensityChange = (intensity: GlowIntensity) => {
    onChange({ ...value, intensity });
  };

  const glowCSS = generateGlowCSS(value);

  const isPresetColor = COLOR_PRESETS.some(
    (p) => p.hex.toLowerCase() === value.color.toLowerCase()
  );

  return (
    <div className="space-y-5">
      {/* Color Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Kolor poświaty
        </label>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_PRESETS.map((preset) => {
            const isSelected =
              value.color.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleColorChange(preset.hex)}
                disabled={disabled}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 p-2 border-2 transition-all rounded-xl',
                  'hover:scale-105 active:scale-95',
                  isSelected
                    ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-500 ring-offset-1 dark:bg-violet-950/30 dark:ring-offset-zinc-900'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <div
                  className="w-8 h-8 rounded-full shadow-md ring-1 ring-white/50 dark:ring-black/50"
                  style={{ backgroundColor: preset.hex }}
                />
                <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                  {preset.name}
                </span>
                {isSelected && (
                  <div className="absolute flex items-center justify-center w-4 h-4 text-white bg-violet-600 rounded-full shadow-lg -top-1 -right-1">
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom color picker */}
        <button
          type="button"
          onClick={() => setShowCustomColor(!showCustomColor)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all rounded-lg',
            showCustomColor || !isPresetColor
              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <div
            className="w-4 h-4 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: value.color }}
          />
          {showCustomColor ? 'Ukryj picker' : 'Własny kolor'}
        </button>

        {showCustomColor && (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5">
            <input
              type="color"
              value={value.color}
              onChange={(e) => handleColorChange(e.target.value)}
              disabled={disabled}
              className="w-12 h-12 border-2 border-white shadow-lg cursor-pointer rounded-lg dark:border-zinc-800"
            />
            <div className="flex-1">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Wybrany kolor
              </p>
              <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
                {value.color}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Intensity Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Intensywność
        </label>
        <div className="grid grid-cols-4 gap-2">
          {INTENSITY_PRESETS.map((preset) => {
            const isSelected = value.intensity === preset.id;
            const previewGlow = generateGlowCSS({
              color: value.color,
              intensity: preset.id,
            });
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleIntensityChange(preset.id)}
                disabled={disabled}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 p-3 border-2 transition-all rounded-xl',
                  'hover:scale-105 active:scale-95',
                  isSelected
                    ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-500 ring-offset-1 dark:bg-violet-950/30 dark:ring-offset-zinc-900'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <div
                  className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800"
                  style={{ boxShadow: previewGlow }}
                />
                <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                  {preset.name}
                </span>
                {isSelected && (
                  <div className="absolute flex items-center justify-center w-4 h-4 text-white bg-violet-600 rounded-full shadow-lg -top-1 -right-1">
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Podgląd poświaty
        </label>
        <div
          className="w-full h-20 rounded-xl bg-white dark:bg-zinc-800"
          style={{ boxShadow: glowCSS }}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono break-all">
          {glowCSS}
        </p>
      </div>
    </div>
  );
}

export { COLOR_PRESETS, INTENSITY_PRESETS };
export type { GlowValue, GlowIntensity };
