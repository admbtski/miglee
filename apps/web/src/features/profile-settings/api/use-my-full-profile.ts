'use client';

import {
  GetMyFullProfileDocument,
  type GetMyFullProfileQuery,
  type GetMyFullProfileQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query';

export const MY_FULL_PROFILE_KEY = (
  variables: GetMyFullProfileQueryVariables
) => ['MyFullProfile', variables] as const;

export function buildMyFullProfileOptions(
  variables: GetMyFullProfileQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetMyFullProfileQuery,
      unknown,
      GetMyFullProfileQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetMyFullProfileQuery,
  unknown,
  GetMyFullProfileQuery,
  QueryKey
> {
  return {
    queryKey: MY_FULL_PROFILE_KEY(variables) as unknown as QueryKey,
    queryFn: () =>
      gqlClient.request<GetMyFullProfileQuery, GetMyFullProfileQueryVariables>(
        GetMyFullProfileDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function useMyFullProfileQuery(
  variables: GetMyFullProfileQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetMyFullProfileQuery,
      unknown,
      GetMyFullProfileQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildMyFullProfileOptions(variables, {
      enabled: !!variables.id,
      ...(options ?? {}),
    })
  );
}
