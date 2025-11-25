'use client';

import * as React from 'react';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HIGHLIGHT_PRESETS,
  DEFAULT_HIGHLIGHT_COLOR,
} from '@/lib/billing-constants';

interface HighlightColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export function HighlightColorPicker({
  value,
  onChange,
  disabled = false,
}: HighlightColorPickerProps) {
  const [showCustomPicker, setShowCustomPicker] = React.useState(false);
  const [customColor, setCustomColor] = React.useState(value);

  // Check if current value is a preset
  const isPreset = HIGHLIGHT_PRESETS.some(
    (p) => p.hex.toLowerCase() === value.toLowerCase()
  );

  const handlePresetSelect = (hex: string) => {
    onChange(hex);
    setShowCustomPicker(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Kolor wyróżnienia
        </label>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Wybierz kolor ramki wydarzenia
        </span>
      </div>

      {/* Preset Colors */}
      <div className="grid grid-cols-4 gap-3">
        {HIGHLIGHT_PRESETS.map((preset) => {
          const isSelected = value.toLowerCase() === preset.hex.toLowerCase();

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.hex)}
              disabled={disabled}
              className={cn(
                'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                'hover:scale-105 active:scale-95',
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900'
                  : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Color Circle */}
              <div
                className="w-12 h-12 rounded-full ring-2 ring-white/50 dark:ring-black/50 shadow-lg"
                style={{ backgroundColor: preset.hex }}
              />

              {/* Color Name */}
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {preset.name}
              </span>

              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white shadow-lg">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Color Option */}
      <div className="pt-4 border-t border-zinc-200 dark:border-white/5">
        <button
          type="button"
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-3 w-full p-4 rounded-xl border-2 transition-all',
            'hover:border-zinc-300 dark:hover:border-white/20',
            showCustomPicker || !isPreset
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
              : 'border-zinc-200 dark:border-white/10',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
            <Palette className="w-6 h-6 text-zinc-600 dark:text-zinc-300" />
          </div>

          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Własny kolor
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Wybierz dowolny kolor z palety
            </p>
          </div>

          {!isPreset && (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white shadow-lg">
              <Check className="w-3 h-3" strokeWidth={3} />
            </div>
          )}
        </button>

        {/* Custom Color Picker (Expanded) */}
        {showCustomPicker && (
          <div className="mt-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  disabled={disabled}
                  className="w-20 h-20 rounded-xl cursor-pointer border-2 border-white dark:border-zinc-800 shadow-lg"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Kod koloru (HEX)
                </label>
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    // Only update if it's a valid hex color
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      onChange(e.target.value);
                    }
                  }}
                  placeholder="#f59e0b"
                  disabled={disabled}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg',
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
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5">
        <p className="mb-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Podgląd wyróżnienia
        </p>
        <div
          className="relative w-full h-32 rounded-xl ring-2 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900"
          style={{
            boxShadow: `0 0 0 2px ${value}33, 0 0 16px ${value}55, 0 0 48px ${value}33`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Twoje wydarzenie z wyróżnieniem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
