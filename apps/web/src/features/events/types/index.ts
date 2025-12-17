/**
 * Events Feature Types
 */

import type {
  EventStatus,
  GetEventsQueryVariables,
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
 * Query variables for fetching events (without offset for infinite scroll)
 */
export type EventsQueryVariables = Omit<GetEventsQueryVariables, 'offset'>;

// Event types
export * from './event';
export * from './event-details';
export * from './my-events';
export * from './sponsorship';
