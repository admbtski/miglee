/**
 * Constants for profile settings page
 */

type LanguageOption = {
  code: string;
  label: string;
};

/**
 * Common languages for language selection
 */
export const COMMON_LANGUAGES: LanguageOption[] = [
  // Core / default
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polish' },

  // Major EU languages
  { code: 'de', label: 'German' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'sv', label: 'Swedish' },
  { code: 'da', label: 'Danish' },
  { code: 'fi', label: 'Finnish' },
  { code: 'no', label: 'Norwegian' },

  // Central & Eastern Europe
  { code: 'cs', label: 'Czech' },
  { code: 'sk', label: 'Slovak' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'ro', label: 'Romanian' },
  { code: 'bg', label: 'Bulgarian' },
  { code: 'hr', label: 'Croatian' },
  { code: 'sl', label: 'Slovenian' },
  { code: 'sr', label: 'Serbian' },

  // Baltics
  { code: 'lt', label: 'Lithuanian' },
  { code: 'lv', label: 'Latvian' },
  { code: 'et', label: 'Estonian' },

  // Eastern / CIS
  { code: 'uk', label: 'Ukrainian' },
  { code: 'ru', label: 'Russian' },

  // Global / common outside EU
  { code: 'tr', label: 'Turkish' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
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
