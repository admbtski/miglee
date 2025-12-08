/**
 * Type definitions for the events search page
 */

import type {
  GetEventsQueryVariables,
  EventStatus,
  JoinMode,
  Level,
  MeetingKind,
} from '@/lib/api/__generated__/react-query-update';

/**
 * Location mode determines how the map center is calculated
 * - EXPLICIT: User has set location in filters
 * - PROFILE_DEFAULT: User has home location in profile
 * - NONE: No location available
 */
export type LocationMode = 'EXPLICIT' | 'PROFILE_DEFAULT' | 'NONE';

/**
 * Map center coordinates
 */
export type MapCenter = {
  lat: number;
  lng: number;
} | null;

/**
 * Committed filter state from URL search params
 */
export type CommittedFilters = {
  q: string;
  city: string | null;
  cityLat: number | null;
  cityLng: number | null;
  cityPlaceId: string | null;
  distanceKm: number;
  startISO: string | null;
  endISO: string | null;
  status: EventStatus;
  kinds: MeetingKind[];
  levels: Level[];
  verifiedOnly: boolean;
  tags: string[];
  keywords: string[];
  categories: string[];
  joinModes: JoinMode[];
};

/**
 * Sort key options for events list
 */
export type SortKey =
  | 'default'
  | 'start_asc'
  | 'start_desc'
  | 'created_desc'
  | 'created_asc'
  | 'updated_desc'
  | 'members_desc'
  | 'members_asc';

/**
 * Query variables for fetching events (without offset for infinite scroll)
 */
export type EventsQueryVariables = Omit<GetEventsQueryVariables, 'offset'>;

export * from './event';
export * from './event-details';
