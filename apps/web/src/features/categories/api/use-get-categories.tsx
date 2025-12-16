import {
  GetCategoriesDocument,
  GetCategoriesQuery,
  GetCategoriesQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_CATEGORIES_LIST_KEY } from './categories-query-keys';

export function buildGetCategoriesOptions(
  variables?: GetCategoriesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCategoriesQuery, Error, GetCategoriesQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetCategoriesQuery, Error, GetCategoriesQuery, QueryKey> {
  return {
    queryKey: GET_CATEGORIES_LIST_KEY(variables) as unknown as QueryKey,
    queryFn: async () => {
      if (variables) {
        return gqlClient.request<
          GetCategoriesQuery,
          GetCategoriesQueryVariables
        >(GetCategoriesDocument, variables);
      }
      return gqlClient.request<GetCategoriesQuery>(GetCategoriesDocument);
    },
    ...(options ?? {}),
  };
}

export function useGetCategoriesQuery(
  variables?: GetCategoriesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCategoriesQuery, Error, GetCategoriesQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetCategoriesOptions(variables, options));
}
