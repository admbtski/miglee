import {
  GetNotificationsDocument,
  GetNotificationsQuery,
  GetNotificationsQueryVariables,
} from '@/graphql/__generated__/react-query';
import { gqlClient } from '@/graphql/client';
import type { QueryKey } from '@tanstack/react-query';
import {
  UseQueryOptions,
  UseSuspenseQueryOptions,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';

function notificationsQueryKey(
  variables?: GetNotificationsQueryVariables
): QueryKey {
  return variables ? ['GetNotifications', variables] : ['GetNotifications'];
}

export function buildNotificationsOptions(
  variables?: GetNotificationsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetNotificationsQuery,
      unknown,
      GetNotificationsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetNotificationsQuery,
  unknown,
  GetNotificationsQuery,
  QueryKey
> {
  return {
    queryKey: notificationsQueryKey(variables),
    queryFn: async () =>
      gqlClient.request<GetNotificationsQuery, GetNotificationsQueryVariables>(
        GetNotificationsDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function buildNotificationsSuspenseOptions(
  variables?: GetNotificationsQueryVariables,
  options?: Omit<
    UseSuspenseQueryOptions<
      GetNotificationsQuery,
      unknown,
      GetNotificationsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseSuspenseQueryOptions<
  GetNotificationsQuery,
  unknown,
  GetNotificationsQuery,
  QueryKey
> {
  return {
    queryKey: notificationsQueryKey(variables),
    queryFn: async () =>
      gqlClient.request<GetNotificationsQuery, GetNotificationsQueryVariables>(
        GetNotificationsDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function useGetNotificationsQuery(
  variables?: GetNotificationsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetNotificationsQuery,
      unknown,
      GetNotificationsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildNotificationsOptions(variables, options));
}

export function useSuspenseGetNotificationsQuery(
  variables?: GetNotificationsQueryVariables,
  options?: Omit<
    UseSuspenseQueryOptions<
      GetNotificationsQuery,
      unknown,
      GetNotificationsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useSuspenseQuery(
    buildNotificationsSuspenseOptions(variables, options)
  );
}
