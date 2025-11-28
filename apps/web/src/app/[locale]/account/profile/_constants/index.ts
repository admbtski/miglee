/**
 * Constants for profile settings page
 */

import type { LanguageOption } from '../_types';

/**
 * Common languages for language selection
 */
export const COMMON_LANGUAGES: LanguageOption[] = [
  { code: 'pl', label: 'Polish' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'ru', label: 'Russian' },
];

/**
 * Maximum number of interests allowed
 */
export const MAX_INTERESTS = 20;

/**
 * Form validation limits
 */
export const VALIDATION_LIMITS = {
  displayName: { min: 3, max: 40 },
  bioShort: { max: 200 },
  bioLong: { max: 1000 },
  interests: { max: MAX_INTERESTS },
} as const;
