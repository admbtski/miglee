'use client';

// TODO i18n: Color and direction names need translation keys

import * as React from 'react';
import {
  Check,
  ArrowRight,
  ArrowDown,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Preset colors for gradient picker
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

// Gradient directions
const GRADIENT_DIRECTIONS = [
  { id: 'to-r', name: 'W prawo', angle: 90, icon: ArrowRight },
  { id: 'to-br', name: 'Po skosie ↘', angle: 135, icon: ArrowDownRight },
  { id: 'to-b', name: 'W dół', angle: 180, icon: ArrowDown },
  { id: 'to-tr', name: 'Po skosie ↗', angle: 45, icon: ArrowUpRight },
] as const;

type GradientDirection = (typeof GRADIENT_DIRECTIONS)[number]['id'];

interface GradientValue {
  color1: string;
  color2: string;
  direction: GradientDirection;
}

interface GradientPickerProps {
  value: GradientValue;
  onChange: (value: GradientValue) => void;
  disabled?: boolean;
  /** Opacity for the gradient colors (0-1) */
  opacity?: number;
}

/**
 * Generate CSS gradient string from value
 */
export function generateGradientCSS(
  value: GradientValue,
  opacity: number = 0.15
): string {
  const direction = GRADIENT_DIRECTIONS.find((d) => d.id === value.direction);
  const angle = direction?.angle ?? 135;

  // Convert hex to rgba with opacity
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const rgba1 = hexToRgba(value.color1, opacity);
  const rgba2 = hexToRgba(value.color2, opacity * 1.5); // Slightly more opaque at end

  return `linear-gradient(${angle}deg, ${rgba1}, ${rgba2})`;
}

export function GradientPicker({
  value,
  onChange,
  disabled = false,
  opacity = 0.15,
}: GradientPickerProps) {
  const [showCustomColor1, setShowCustomColor1] = React.useState(false);
  const [showCustomColor2, setShowCustomColor2] = React.useState(false);

  const handleColor1Change = (hex: string) => {
    onChange({ ...value, color1: hex });
  };

  const handleColor2Change = (hex: string) => {
    onChange({ ...value, color2: hex });
  };

  const handleDirectionChange = (direction: GradientDirection) => {
    onChange({ ...value, direction });
  };

  const gradientCSS = generateGradientCSS(value, opacity);

  const isPresetColor1 = COLOR_PRESETS.some(
    (p) => p.hex.toLowerCase() === value.color1.toLowerCase()
  );
  const isPresetColor2 = COLOR_PRESETS.some(
    (p) => p.hex.toLowerCase() === value.color2.toLowerCase()
  );

  return (
    <div className="space-y-5">
      {/* Color 1 Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Kolor początkowy
        </label>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_PRESETS.map((preset) => {
            const isSelected =
              value.color1.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleColor1Change(preset.hex)}
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

        {/* Custom color picker for color 1 */}
        <button
          type="button"
          onClick={() => setShowCustomColor1(!showCustomColor1)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all rounded-lg',
            showCustomColor1 || !isPresetColor1
              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <div
            className="w-4 h-4 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: value.color1 }}
          />
          {showCustomColor1 ? 'Ukryj picker' : 'Własny kolor'}
        </button>

        {showCustomColor1 && (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5">
            <input
              type="color"
              value={value.color1}
              onChange={(e) => handleColor1Change(e.target.value)}
              disabled={disabled}
              className="w-12 h-12 border-2 border-white shadow-lg cursor-pointer rounded-lg dark:border-zinc-800"
            />
            <input
              type="text"
              value={value.color1}
              onChange={(e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                  handleColor1Change(e.target.value);
                }
              }}
              placeholder="#f59e0b"
              disabled={disabled}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-sm font-mono',
                'border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900',
                'text-zinc-900 dark:text-zinc-50',
                'focus:outline-none focus:ring-2 focus:ring-violet-500',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />
          </div>
        )}
      </div>

      {/* Color 2 Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Kolor końcowy
        </label>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_PRESETS.map((preset) => {
            const isSelected =
              value.color2.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleColor2Change(preset.hex)}
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

        {/* Custom color picker for color 2 */}
        <button
          type="button"
          onClick={() => setShowCustomColor2(!showCustomColor2)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all rounded-lg',
            showCustomColor2 || !isPresetColor2
              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <div
            className="w-4 h-4 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: value.color2 }}
          />
          {showCustomColor2 ? 'Ukryj picker' : 'Własny kolor'}
        </button>

        {showCustomColor2 && (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5">
            <input
              type="color"
              value={value.color2}
              onChange={(e) => handleColor2Change(e.target.value)}
              disabled={disabled}
              className="w-12 h-12 border-2 border-white shadow-lg cursor-pointer rounded-lg dark:border-zinc-800"
            />
            <input
              type="text"
              value={value.color2}
              onChange={(e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                  handleColor2Change(e.target.value);
                }
              }}
              placeholder="#a855f7"
              disabled={disabled}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-sm font-mono',
                'border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900',
                'text-zinc-900 dark:text-zinc-50',
                'focus:outline-none focus:ring-2 focus:ring-violet-500',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />
          </div>
        )}
      </div>

      {/* Direction Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Kierunek gradientu
        </label>
        <div className="grid grid-cols-4 gap-2">
          {GRADIENT_DIRECTIONS.map((dir) => {
            const isSelected = value.direction === dir.id;
            const Icon = dir.icon;
            return (
              <button
                key={dir.id}
                type="button"
                onClick={() => handleDirectionChange(dir.id)}
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
                  className="flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{
                    background: generateGradientCSS(
                      { ...value, direction: dir.id },
                      0.4
                    ),
                  }}
                >
                  <Icon className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
                </div>
                <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                  {dir.name}
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
          Podgląd gradientu
        </label>
        <div
          className="w-full h-24 rounded-xl ring-1 ring-black/5 dark:ring-white/5"
          style={{ background: gradientCSS }}
        />
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-mono">{value.color1}</span>
          <span>→</span>
          <span className="font-mono">{value.color2}</span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono break-all">
          {gradientCSS}
        </p>
      </div>
    </div>
  );
}

export { COLOR_PRESETS, GRADIENT_DIRECTIONS };
export type { GradientValue, GradientDirection };
