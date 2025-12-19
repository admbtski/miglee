import {
  GetEventDetailQueryVariables,
  GetEventsListingQueryVariables,
  GetEventsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';

/**
 * Query keys for event lifecycle queries.
 * Member-related keys have been moved to @/features/members/api/members-query-keys.ts
 */

export const GET_EVENTS_LISTING_INFINITE_KEY = (
  variables?: Omit<GetEventsListingQueryVariables, 'offset'>
) =>
  variables
    ? (['GetEventsListingInfinite', variables] as const)
    : (['GetEventsListingInfinite'] as const);

export const GET_EVENTS_INFINITE_KEY = (
  variables?: Omit<GetEventsQueryVariables, 'offset'>
) =>
  variables
    ? (['GetEventsInfinite', variables] as const)
    : (['GetEventsInfinite'] as const);

export const GET_EVENT_DETAIL_KEY = (variables: GetEventDetailQueryVariables) =>
  ['GetEventDetail', variables] as const;

export const GET_EVENT_PERMISSIONS_KEY = (eventId: string) =>
  ['GetEventPermissions', eventId] as const;

// =============================================================================
// Re-exports from @/features/members for backwards compatibility
// @deprecated Import directly from '@/features/members' instead
// =============================================================================
export {
  GET_EVENT_MEMBERS_KEY,
  GET_EVENT_MEMBER_KEY,
  GET_MY_MEMBERSHIP_FOR_EVENT_KEY,
  GET_MY_MEMBERSHIPS_KEY,
  GET_EVENT_MEMBER_STATS_KEY,
  GET_MY_EVENTS_KEY,
} from '@/features/members';
