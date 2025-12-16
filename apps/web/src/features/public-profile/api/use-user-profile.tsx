'use client';

import {
  GetUserProfileDocument,
  type GetUserProfileQuery,
  type GetUserProfileQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query';

export const USER_PROFILE_KEY = (variables: GetUserProfileQueryVariables) =>
  ['UserProfile', variables] as const;

export async function fetchUserProfile(
  variables: GetUserProfileQueryVariables
) {
  return gqlClient.request<GetUserProfileQuery, GetUserProfileQueryVariables>(
    GetUserProfileDocument,
    variables
  );
}

export function buildUserProfileOptions(
  variables: GetUserProfileQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetUserProfileQuery,
      unknown,
      GetUserProfileQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetUserProfileQuery,
  unknown,
  GetUserProfileQuery,
  QueryKey
> {
  return {
    queryKey: USER_PROFILE_KEY(variables) as unknown as QueryKey,
    queryFn: () =>
      gqlClient.request<GetUserProfileQuery, GetUserProfileQueryVariables>(
        GetUserProfileDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function useUserProfileQuery(
  variables: GetUserProfileQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetUserProfileQuery,
      unknown,
      GetUserProfileQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildUserProfileOptions(variables, {
      enabled: !!(variables.id || variables.name),
      ...(options ?? {}),
    })
  );
}
