/**
 * Plan Animations Configuration
 *
 * Centralized configuration for premium plan visual effects.
 * Adjust these values to control shimmer, pulse, and other animations globally.
 */

export const planAnimationConfig = {
  /**
   * Shimmer Effect Configuration
   * Controls the sweeping light effect across premium cards
   */
  shimmer: {
    /** Duration of the shimmer animation in seconds */
    duration: 2,
    /** Delay between shimmer animations in seconds */
    repeatDelay: 1,
    /** Maximum opacity of the shimmer effect (0-1) */
    maxOpacity: 0.8,
    /** Opacity multipliers for each plan tier */
    planOpacity: {
      basic: 0.2, // 20% opacity for emerald shimmer
      plus: 0.25, // 30% opacity for indigo shimmer
      premium: 0.3, // 40% opacity for amber shimmer
    },
    /** Easing function for smooth animation */
    easing: 'easeInOut' as const,
  },

  /**
   * Gradient Pulse Configuration
   * Controls the pulsing gradient overlay on premium cards
   */
  gradientPulse: {
    /** Duration of one pulse cycle in seconds */
    duration: 3,
    /** Opacity range for the pulse [min, max, min] */
    opacityRange: [0.2, 0.6, 0.2] as [number, number, number],
    /** Scale range for the pulse [start, peak, end] */
    scaleRange: [1, 1.02, 1] as [number, number, number],
    /** Easing function */
    easing: 'easeInOut' as const,
  },

  /**
   * Badge Animation Configuration
   * Controls the PlanBadge pulse and rotation effects
   */
  badge: {
    /** Duration of the badge animation in seconds */
    duration: 1,
    /** Delay between badge animations in seconds */
    repeatDelay: 2,
    /** Scale range for pulse effect [start, peak, end] */
    scaleRange: [1, 1.08, 1] as [number, number, number],
    /** Rotation range for wiggle effect [positions in degrees] */
    rotateRange: [0, -3, 3, -3, 0] as number[],
    /** Hover scale multiplier */
    hoverScale: 1.15,
    /** Hover rotation range [positions in degrees] */
    hoverRotateRange: [0, -8, 8, -8, 0] as number[],
    /** Hover animation duration in seconds */
    hoverDuration: 0.5,
    /** Easing function */
    easing: 'easeInOut' as const,
  },

  /**
   * Card Hover Configuration
   * Controls the card lift and scale effects on hover
   */
  cardHover: {
    /** Vertical lift in pixels (negative = up) */
    liftY: -4,
    /** Scale multiplier on hover */
    scale: 1.015,
    /** Spring animation settings */
    spring: {
      stiffness: 400,
      damping: 25,
      mass: 0.5,
    },
  },

  /**
   * Glowing Shadow Configuration
   * Controls the animated shadow/glow effect for premium cards
   * Synchronized with shimmer effect (4s total cycle: 2s animation + 2s delay)
   */
  glowingShadow: {
    /** Duration of the glow pulse animation in seconds (matches shimmer cycle) */
    duration: 3,
    /** Shadow configurations for each plan tier */
    shadows: {
      basic: {
        min: '0 0 0 1px rgba(16, 185, 129, 0.2), 0 8px 20px -8px rgba(16, 185, 129, 0.25)',
        mid: '0 0 0 1px rgba(16, 185, 129, 0.35), 0 10px 30px -10px rgba(16, 185, 129, 0.45)',
        max: '0 0 0 1px rgba(16, 185, 129, 0.4), 0 12px 35px -10px rgba(16, 185, 129, 0.5)',
      },
      plus: {
        min: '0 0 0 1px rgba(99, 102, 241, 0.2), 0 8px 20px -8px rgba(99, 102, 241, 0.25)',
        mid: '0 0 0 1px rgba(99, 102, 241, 0.35), 0 10px 30px -10px rgba(99, 102, 241, 0.45)',
        max: '0 0 0 1px rgba(99, 102, 241, 0.4), 0 12px 35px -10px rgba(99, 102, 241, 0.5)',
      },
      premium: {
        min: '0 0 0 1px rgba(245, 158, 11, 0.25), 0 10px 28px -10px rgba(245, 158, 11, 0.3)',
        mid: '0 0 0 1px rgba(245, 158, 11, 0.4), 0 12px 34px -12px rgba(245, 158, 11, 0.5)',
        max: '0 0 0 1px rgba(245, 158, 11, 0.45), 0 14px 38px -12px rgba(245, 158, 11, 0.55)',
      },
    },
    /** Easing function */
    easing: 'easeInOut' as const,
  },
} as const;

/**
 * Helper function to get shimmer opacity for a specific plan
 */
export function getShimmerOpacity(plan: 'basic' | 'plus' | 'premium'): number {
  return planAnimationConfig.shimmer.planOpacity[plan];
}

/**
 * Helper function to check if animations should be enabled
 * Can be extended to respect user's motion preferences
 */
export function shouldEnableAnimations(): boolean {
  // Check if user prefers reduced motion
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    return !prefersReducedMotion;
  }
  return true;
}
