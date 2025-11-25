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

/**
 * Generate background gradient styles for highlighted events
 */
export function getHighlightBackgroundStyle(
  highlightColor: string | null | undefined,
  isBoosted: boolean,
  intensity: 'subtle' | 'medium' | 'strong' = 'medium'
): React.CSSProperties {
  if (!isBoosted || !highlightColor) {
    return {};
  }

  // Convert HEX to RGB for alpha manipulation
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result && result[1] && result[2] && result[3]
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 59, g: 130, b: 246 }; // fallback to blue
  };

  const rgb = hexToRgb(highlightColor);
  const rgbString = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  // Define opacity levels based on intensity
  const opacities = {
    subtle: { start: 0.03, end: 0.08 },
    medium: { start: 0.05, end: 0.12 },
    strong: { start: 0.08, end: 0.18 },
  };

  const { start, end } = opacities[intensity];

  return {
    background: `linear-gradient(135deg, rgba(${rgbString}, ${start}) 0%, rgba(${rgbString}, ${end}) 100%)`,
  };
}
