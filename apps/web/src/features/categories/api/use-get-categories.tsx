import {
  GetCategoriesDocument,
  GetCategoriesQuery,
  GetCategoriesQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { categoriesKeys } from './categories-query-keys';

export function buildGetCategoriesOptions(
  variables: GetCategoriesQueryVariables = {},
  options?: Omit<
    UseQueryOptions<GetCategoriesQuery, Error, GetCategoriesQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetCategoriesQuery, Error, GetCategoriesQuery, QueryKey> {
  return {
    queryKey: categoriesKeys.list(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<GetCategoriesQuery, GetCategoriesQueryVariables>(
        GetCategoriesDocument,
        variables
      ),
    ...options,
  };
}

export function useGetCategoriesQuery(
  variables: GetCategoriesQueryVariables = {},
  options?: Omit<
    UseQueryOptions<GetCategoriesQuery, Error, GetCategoriesQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetCategoriesQuery, Error, GetCategoriesQuery, QueryKey>(
    buildGetCategoriesOptions(variables, options)
  );
}
