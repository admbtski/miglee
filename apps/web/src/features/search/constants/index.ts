/**
 * Search feature constants
 */

import type { SortKey } from '../types';

export const DEFAULT_DISTANCE_KM = 50;

export const FILTER_PARAM_KEYS = [
  'q',
  'city',
  'cityLat',
  'cityLng',
  'cityPlaceId',
  'distance',
  'startISO',
  'endISO',
  'status',
  'kinds',
  'levels',
  'verifiedOnly',
  'tags',
  'keywords',
  'categories',
  'joinModes',
] as const;

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

