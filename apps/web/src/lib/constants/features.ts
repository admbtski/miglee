/**
 * Feature flags for the application
 */

export const FEATURES = {
  /**
   * List virtualization mode:
   * - 'always': Always use virtualized list
   * - 'hybrid': Use virtualization only for large lists (50+ items)
   * - 'never': Never use virtualization (default grid)
   */
  VIRTUALIZATION_MODE: 'hybrid' as 'always' | 'hybrid' | 'never',

  /** Threshold for hybrid mode (number of items) */
  VIRTUALIZATION_THRESHOLD: 50,

  /** Enable experimental features */
  EXPERIMENTAL: false,
} as const;
