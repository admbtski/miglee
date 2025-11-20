/**
 * Type definitions for profile settings page
 */

import type { GetMyFullProfileQuery } from '@/lib/api/__generated__/react-query-update';

/**
 * Tab identifiers for profile settings
 */
export type TabId = 'profile' | 'sports' | 'social' | 'privacy';

/**
 * Tab configuration
 */
export type TabConfig = {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

/**
 * User data from profile query
 */
export type ProfileUser = GetMyFullProfileQuery['user'];

/**
 * Props for tab components
 */
export type TabProps = {
  user: ProfileUser | null | undefined;
  userId: string;
};

/**
 * Location data structure
 */
export type LocationData = {
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
};

/**
 * Language option
 */
export type LanguageOption = {
  code: string;
  label: string;
};
