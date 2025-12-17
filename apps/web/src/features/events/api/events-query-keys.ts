import {
  GetEventDetailQueryVariables,
  GetEventMemberQueryVariables,
  GetEventMembersQueryVariables,
  GetEventMemberStatsQueryVariables,
  GetEventsListingQueryVariables,
  GetEventsQueryVariables,
  GetMyEventsQueryVariables,
  GetMyMembershipForEventQueryVariables,
  GetMyMembershipsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';

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

export const GET_EVENT_MEMBERS_KEY = (
  variables: GetEventMembersQueryVariables
) => ['GetEventMembers', variables] as const;

export const GET_EVENT_MEMBER_KEY = (variables: GetEventMemberQueryVariables) =>
  ['GetEventMember', variables] as const;

export const GET_MY_MEMBERSHIP_FOR_EVENT_KEY = (
  variables: GetMyMembershipForEventQueryVariables
) => ['GetMyMembershipForEvent', variables] as const;

export const GET_MY_MEMBERSHIPS_KEY = (
  variables?: GetMyMembershipsQueryVariables
) =>
  variables
    ? (['GetMyMemberships', variables] as const)
    : (['GetMyMemberships'] as const);

export const GET_EVENT_MEMBER_STATS_KEY = (
  variables: GetEventMemberStatsQueryVariables
) => ['GetEventMemberStats', variables] as const;

export const GET_MY_EVENTS_KEY = (variables?: GetMyEventsQueryVariables) =>
  variables
    ? (['GetMyEvents', variables] as const)
    : (['GetMyEvents'] as const);
