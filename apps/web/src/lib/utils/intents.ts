/**
 * Utility functions for intents page
 */

/**
 * Type guard to check if value is a non-empty string
 */
export const notEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0;

/**
 * Builds grid column classes based on map visibility
 */
export const buildGridCols = (mapVisible: boolean): string =>
  mapVisible
    ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_clamp(360px,36vw,640px)]'
    : 'grid-cols-1';

/**
 * Formats plural suffix for event count
 */
export const getPluralSuffix = (count: number): string =>
  count !== 1 ? 's' : '';
