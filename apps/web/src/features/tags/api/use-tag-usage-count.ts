// apps/web/src/hooks/tags.tsx
import {
  GetTagUsageCountDocument,
  GetTagUsageCountQuery,
  GetTagUsageCountQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

export function useGetTagUsageCountQuery(
  variables: GetTagUsageCountQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetTagUsageCountQuery,
      unknown,
      GetTagUsageCountQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['GetTagUsageCount', variables] as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<GetTagUsageCountQuery, GetTagUsageCountQueryVariables>(
        GetTagUsageCountDocument,
        variables
      ),
    enabled: !!variables.slug && variables.slug.trim().length > 0,
    ...(options ?? {}),
  });
}
