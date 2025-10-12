import {
  GetUserDocument,
  GetUserQuery,
  GetUserQueryVariables,
  GetUsersDocument,
  GetUsersQuery,
  GetUsersQueryVariables,
} from '@/graphql/__generated__/react-query';
import { gqlClient } from '@/graphql/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

/* ======================== Keys ======================== */

export const GET_USERS_LIST_KEY = (variables?: GetUsersQueryVariables) =>
  variables ? ['GetUsers', variables] : ['GetUsers'];

export const GET_USER_ONE_KEY = (variables: GetUserQueryVariables) => [
  'GetUser',
  variables,
];

/* ===================== Query builders ===================== */

export function buildGetUsersOptions(
  variables?: GetUsersQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUsersQuery, unknown, GetUsersQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetUsersQuery, unknown, GetUsersQuery, QueryKey> {
  return {
    queryKey: GET_USERS_LIST_KEY(variables),
    queryFn: () =>
      variables
        ? gqlClient.request<GetUsersQuery, GetUsersQueryVariables>(
            GetUsersDocument,
            variables
          )
        : gqlClient.request<GetUsersQuery>(GetUsersDocument),
    ...(options ?? {}),
  };
}

export function buildGetUserOptions(
  variables: GetUserQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUserQuery, unknown, GetUserQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetUserQuery, unknown, GetUserQuery, QueryKey> {
  return {
    queryKey: GET_USER_ONE_KEY(variables),
    queryFn: () =>
      gqlClient.request<GetUserQuery, GetUserQueryVariables>(
        GetUserDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

/* ========================= Hooks ========================= */

export function useUsersQuery(
  variables?: GetUsersQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUsersQuery, unknown, GetUsersQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetUsersOptions(variables, options));
}

export function useUserQuery(
  variables: GetUserQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUserQuery, unknown, GetUserQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetUserOptions(variables, {
      enabled: !!variables.id,
      ...(options ?? {}),
    })
  );
}
