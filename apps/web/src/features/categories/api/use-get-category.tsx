import {
  GetCategoryDocument,
  GetCategoryQuery,
  GetCategoryQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { categoriesKeys } from './categories-query-keys';

export function buildGetCategoryOptions(
  variables?: GetCategoryQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCategoryQuery, Error, GetCategoryQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetCategoryQuery, Error, GetCategoryQuery, QueryKey> {
  return {
    queryKey: categoriesKeys.detail(variables) as unknown as QueryKey,
    queryFn: async () => {
      if (variables) {
        return gqlClient.request<GetCategoryQuery, GetCategoryQueryVariables>(
          GetCategoryDocument,
          variables
        );
      }
      return gqlClient.request<GetCategoryQuery>(GetCategoryDocument);
    },
    ...(options ?? {}),
  };
}

export function useGetCategoryQuery(
  variables: GetCategoryQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCategoryQuery, Error, GetCategoryQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: categoriesKeys.detail(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<GetCategoryQuery, GetCategoryQueryVariables>(
        GetCategoryDocument,
        variables
      ),
    enabled: !!(variables?.id || variables?.slug),
    ...(options ?? {}),
  });
}
