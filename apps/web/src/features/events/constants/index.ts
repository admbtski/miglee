/**
 * Constants for the events search page
 */

import type { SortKey } from '../types';

/**
 * Default distance radius in kilometers for location-based search
 */
export const DEFAULT_DISTANCE_KM = 30;

/**
 * Valid sort keys for URL validation
 */
export const VALID_SORT_KEYS = new Set<SortKey>([
  'default',
  'start_asc',
  'start_desc',
  'created_desc',
  'created_asc',
  'updated_desc',
  'members_desc',
  'members_asc',
]);

/**
 * URL search param keys that are managed by the filter system
 */
export const FILTER_PARAM_KEYS = [
  'q',
  'city',
  'cityLat',
  'cityLng',
  'cityPlaceId',
  'distance',
  'start',
  'end',
  'status',
  'kinds',
  'levels',
  'verified',
  'tags',
  'keywords',
  'categories',
  'joinModes',
] as const;
