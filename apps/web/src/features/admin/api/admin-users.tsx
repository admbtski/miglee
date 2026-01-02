/**
 * Admin User Management API Hooks
 */

import {
  AdminUserCommentsDocument,
  AdminUserCommentsQuery,
  AdminUserCommentsQueryVariables,
  AdminUserReviewsDocument,
  AdminUserReviewsQuery,
  AdminUserReviewsQueryVariables,
  AdminUserMembershipsDocument,
  AdminUserMembershipsQuery,
  AdminUserMembershipsQueryVariables,
  AdminUserEventsDocument,
  AdminUserEventsQuery,
  AdminUserEventsQueryVariables,
  AdminUserNotificationsDocument,
  AdminUserNotificationsQuery,
  AdminUserNotificationsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

/* ======================== Keys ======================== */

export const ADMIN_USER_COMMENTS_KEY = (
  variables: AdminUserCommentsQueryVariables
) => ['AdminUserComments', variables] as const;

export const ADMIN_USER_REVIEWS_KEY = (
  variables: AdminUserReviewsQueryVariables
) => ['AdminUserReviews', variables] as const;

export const ADMIN_USER_MEMBERSHIPS_KEY = (
  variables: AdminUserMembershipsQueryVariables
) => ['AdminUserMemberships', variables] as const;

export const ADMIN_USER_EVENTS_KEY = (
  variables: AdminUserEventsQueryVariables
) => ['AdminUserEvents', variables] as const;

// REMOVED: AdminUserDmThreads - użyj /admin/dm page zamiast tego

export const ADMIN_USER_NOTIFICATIONS_KEY = (
  variables: AdminUserNotificationsQueryVariables
) => ['AdminUserNotifications', variables] as const;

/* ===================== Query builders ===================== */

export function buildAdminUserCommentsOptions(
  variables: AdminUserCommentsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      AdminUserCommentsQuery,
      unknown,
      AdminUserCommentsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  AdminUserCommentsQuery,
  unknown,
  AdminUserCommentsQuery,
  QueryKey
> {
  return {
    queryKey: ADMIN_USER_COMMENTS_KEY(variables) as unknown as QueryKey,
    queryFn: () =>
      gqlClient.request<
        AdminUserCommentsQuery,
        AdminUserCommentsQueryVariables
      >(AdminUserCommentsDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminUserReviewsOptions(
  variables: AdminUserReviewsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      AdminUserReviewsQuery,
      unknown,
      AdminUserReviewsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  AdminUserReviewsQuery,
  unknown,
  AdminUserReviewsQuery,
  QueryKey
> {
  return {
    queryKey: ADMIN_USER_REVIEWS_KEY(variables) as unknown as QueryKey,
    queryFn: () =>
      gqlClient.request<AdminUserReviewsQuery, AdminUserReviewsQueryVariables>(
        AdminUserReviewsDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function buildAdminUserMembershipsOptions(
  variables: AdminUserMembershipsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      AdminUserMembershipsQuery,
      unknown,
      AdminUserMembershipsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  AdminUserMembershipsQuery,
  unknown,
  AdminUserMembershipsQuery,
  QueryKey
> {
  return {
    queryKey: ADMIN_USER_MEMBERSHIPS_KEY(variables) as unknown as QueryKey,
    queryFn: () =>
      gqlClient.request<
        AdminUserMembershipsQuery,
        AdminUserMembershipsQueryVariables
      >(AdminUserMembershipsDocument, variables),
    ...(options ?? {}),
  };
}

export function buildAdminUserEventsOptions(
  variables: AdminUserEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      AdminUserEventsQuery,
      unknown,
      AdminUserEventsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  AdminUserEventsQuery,
  unknown,
  AdminUserEventsQuery,
  QueryKey
> {
  return {
    queryKey: ADMIN_USER_EVENTS_KEY(variables) as unknown as QueryKey,
    queryFn: () =>
      gqlClient.request<AdminUserEventsQuery, AdminUserEventsQueryVariables>(
        AdminUserEventsDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

/* ========================= Hooks ========================= */

export function useAdminUserCommentsQuery(
  variables: AdminUserCommentsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      AdminUserCommentsQuery,
      unknown,
      AdminUserCommentsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildAdminUserCommentsOptions(variables, {
      enabled: !!variables.userId,
      ...(options ?? {}),
    })
  );
}

export function useAdminUserReviewsQuery(
  variables: AdminUserReviewsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      AdminUserReviewsQuery,
      unknown,
      AdminUserReviewsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildAdminUserReviewsOptions(variables, {
      enabled: !!variables.userId,
      ...(options ?? {}),
    })
  );
}

export function useAdminUserMembershipsQuery(
  variables: AdminUserMembershipsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      AdminUserMembershipsQuery,
      unknown,
      AdminUserMembershipsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildAdminUserMembershipsOptions(variables, {
      enabled: !!variables.userId,
      ...(options ?? {}),
    })
  );
}

export function useAdminUserEventsQuery(
  variables: AdminUserEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      AdminUserEventsQuery,
      unknown,
      AdminUserEventsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildAdminUserEventsOptions(variables, {
      enabled: !!variables.userId,
      ...(options ?? {}),
    })
  );
}

// REMOVED: useAdminUserDmThreadsQuery - użyj /admin/dm page zamiast tego

export function buildAdminUserNotificationsOptions(
  variables: AdminUserNotificationsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      AdminUserNotificationsQuery,
      unknown,
      AdminUserNotificationsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  AdminUserNotificationsQuery,
  unknown,
  AdminUserNotificationsQuery,
  QueryKey
> {
  return {
    queryKey: ADMIN_USER_NOTIFICATIONS_KEY(variables) as unknown as QueryKey,
    queryFn: () =>
      gqlClient.request<
        AdminUserNotificationsQuery,
        AdminUserNotificationsQueryVariables
      >(AdminUserNotificationsDocument, variables),
    ...(options ?? {}),
  };
}

export function useAdminUserNotificationsQuery(
  variables: AdminUserNotificationsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      AdminUserNotificationsQuery,
      unknown,
      AdminUserNotificationsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildAdminUserNotificationsOptions(variables, {
      enabled: !!variables.userId,
      ...(options ?? {}),
    })
  );
}
