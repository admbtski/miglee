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
    repeatDelay: 2,
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
    opacityRange: [0, 0.3, 0] as [number, number, number],
    /** Scale range for the pulse [start, peak, end] */
    scaleRange: [1, 1.05, 1] as [number, number, number],
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
