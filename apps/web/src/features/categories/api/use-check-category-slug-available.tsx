import {
  CheckCategorySlugAvailableDocument,
  CheckCategorySlugAvailableQuery,
  CheckCategorySlugAvailableQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

export function useCheckCategorySlugAvailableQuery(
  variables: CheckCategorySlugAvailableQueryVariables,
  options?: Omit<
    UseQueryOptions<
      CheckCategorySlugAvailableQuery,
      unknown,
      CheckCategorySlugAvailableQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['CheckCategorySlugAvailable', variables] as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        CheckCategorySlugAvailableQuery,
        CheckCategorySlugAvailableQueryVariables
      >(CheckCategorySlugAvailableDocument, variables),
    enabled: !!variables.slug && variables.slug.trim().length > 0,
    ...(options ?? {}),
  });
}
