import {
  GetCategoryDocument,
  GetCategoryQuery,
  GetCategoryQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_CATEGORY_ONE_KEY } from './category-query-keys';

export function buildGetCategoryOptions(
  variables?: GetCategoryQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCategoryQuery, unknown, GetCategoryQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetCategoryQuery, unknown, GetCategoryQuery, QueryKey> {
  return {
    queryKey: GET_CATEGORY_ONE_KEY(variables) as unknown as QueryKey,
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
    UseQueryOptions<GetCategoryQuery, unknown, GetCategoryQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: GET_CATEGORY_ONE_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<GetCategoryQuery, GetCategoryQueryVariables>(
        GetCategoryDocument,
        variables
      ),
    enabled: !!(variables?.id || variables?.slug),
    ...(options ?? {}),
  });
}
