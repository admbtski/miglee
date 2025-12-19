import {
  GetMyMembershipsDocument,
  GetMyMembershipsQuery,
  GetMyMembershipsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

export const GET_MY_MEMBERSHIPS_KEY = (
  variables?: GetMyMembershipsQueryVariables
) =>
  variables
    ? (['GetMyMemberships', variables] as const)
    : (['GetMyMemberships'] as const);

export function buildGetMyMembershipsOptions(
  variables?: GetMyMembershipsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetMyMembershipsQuery,
      unknown,
      GetMyMembershipsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetMyMembershipsQuery,
  unknown,
  GetMyMembershipsQuery,
  QueryKey
> {
  return {
    queryKey: GET_MY_MEMBERSHIPS_KEY(variables) as QueryKey,
    queryFn: () =>
      variables
        ? gqlClient.request<
            GetMyMembershipsQuery,
            GetMyMembershipsQueryVariables
          >(GetMyMembershipsDocument, variables)
        : gqlClient.request<GetMyMembershipsQuery>(GetMyMembershipsDocument),
    ...(options ?? {}),
  };
}

export function useMyMembershipsQuery(
  variables?: GetMyMembershipsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetMyMembershipsQuery,
      unknown,
      GetMyMembershipsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetMyMembershipsOptions(variables, options));
}

