import {
  GetCategoryUsageCountDocument,
  GetCategoryUsageCountQuery,
  GetCategoryUsageCountQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

export function useGetCategoryUsageCountQuery(
  variables: GetCategoryUsageCountQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetCategoryUsageCountQuery,
      unknown,
      GetCategoryUsageCountQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['GetCategoryUsageCount', variables] as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        GetCategoryUsageCountQuery,
        GetCategoryUsageCountQueryVariables
      >(GetCategoryUsageCountDocument, variables),
    enabled: !!variables.slug && variables.slug.trim().length > 0,
    ...(options ?? {}),
  });
}
