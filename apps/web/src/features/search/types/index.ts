/**
 * Search feature types
 */

import { EventStatus, JoinMode, Level, MeetingKind } from '@/lib/api/__generated__/react-query-update';

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

export type LocationMode = 'EXPLICIT' | 'PROFILE_DEFAULT' | 'NONE';

export type SortKey =
  | 'default'
  | 'start_asc'
  | 'start_desc'
  | 'created_desc'
  | 'created_asc'
  | 'updated_desc'
  | 'members_desc'
  | 'members_asc';

