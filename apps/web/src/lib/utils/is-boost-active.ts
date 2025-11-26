import type { CSSProperties } from 'react';

/**
 * Check if a boost is currently active (within 24 hours of boostedAt timestamp)
 */
export function isBoostActive(boostedAt: string | null | undefined): boolean {
  if (!boostedAt) return false;

  const boostedTime = new Date(boostedAt).getTime();
  const now = Date.now();
  const elapsed = now - boostedTime;

  // 24 hours in milliseconds
  return elapsed < 24 * 60 * 60 * 1000;
}

type HighlightIntensity = 'subtle' | 'medium' | 'strong';

/**
 * Generate background gradient styles for highlighted events
 */
export function getHighlightBackgroundStyle(
  highlightColor: string | null | undefined,
  isBoosted: boolean,
  intensity: HighlightIntensity = 'medium'
): CSSProperties | undefined {
  if (!isBoosted || !highlightColor) {
    return undefined;
  }

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result && result[1] && result[2] && result[3]
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 245, g: 158, b: 11 }; // fallback to amber
  };

  const rgb = hexToRgb(highlightColor);

  let startOpacity: number;
  let endOpacity: number;

  switch (intensity) {
    case 'subtle':
      startOpacity = 0.03; // 3%
      endOpacity = 0.08; // 8%
      break;
    case 'medium':
      startOpacity = 0.05; // 5%
      endOpacity = 0.12; // 12%
      break;
    case 'strong':
      startOpacity = 0.08; // 8%
      endOpacity = 0.18; // 18%
      break;
  }

  return {
    // background: `linear-gradient(135deg, rgba(${rgb.r},${rgb.g},${rgb.b},${startOpacity}), rgba(${rgb.r},${rgb.g},${rgb.b},${endOpacity}))`,
  };
}

/**
 * Get highlight ring classes and styles for cards
 * Used for event detail cards and event cards in listings
 */
export function getCardHighlightClasses(
  highlightColor: string | null | undefined,
  isBoosted: boolean
): { className: string; style?: CSSProperties } {
  if (!isBoosted || !highlightColor) {
    return { className: '' };
  }

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result && result[1] && result[2] && result[3]
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 245, g: 158, b: 11 };
  };

  const rgb = hexToRgb(highlightColor);

  return {
    className: 'ring-1',
    style: {
      '--tw-ring-color': `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
      boxShadow: `0 0 0 1px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5), 0 0 16px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6), 0 0 48px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`,
    } as CSSProperties,
  };
}

/**
 * Get highlight ring classes for cover images (stronger effect)
 * Used for larger images like event covers
 */
export function getCoverHighlightClasses(
  highlightColor: string | null | undefined,
  isBoosted: boolean
): { className: string; style?: CSSProperties } {
  if (!isBoosted || !highlightColor) {
    return { className: '' };
  }

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result && result[1] && result[2] && result[3]
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 245, g: 158, b: 11 };
  };

  const rgb = hexToRgb(highlightColor);

  return {
    className: 'ring-1',
    style: {
      '--tw-ring-color': `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
      boxShadow: `0 0 0 1px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5), 0 0 24px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6), 0 0 64px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`,
    } as CSSProperties,
  };
}
