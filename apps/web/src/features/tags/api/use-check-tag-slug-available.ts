// apps/web/src/hooks/tags.tsx
import {
  CheckTagSlugAvailableDocument,
  CheckTagSlugAvailableQuery,
  CheckTagSlugAvailableQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

export function useCheckTagSlugAvailableQuery(
  variables: CheckTagSlugAvailableQueryVariables,
  options?: Omit<
    UseQueryOptions<
      CheckTagSlugAvailableQuery,
      unknown,
      CheckTagSlugAvailableQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: ['CheckTagSlugAvailable', variables] as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        CheckTagSlugAvailableQuery,
        CheckTagSlugAvailableQueryVariables
      >(CheckTagSlugAvailableDocument, variables),
    enabled: !!variables.slug && variables.slug.trim().length > 0,
    ...(options ?? {}),
  });
}
