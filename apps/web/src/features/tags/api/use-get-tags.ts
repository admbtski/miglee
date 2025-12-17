// apps/web/src/hooks/tags.tsx
import {
  GetTagsDocument,
  GetTagsQuery,
  GetTagsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { tagsKeys } from './tags-query-keys';

export function buildGetTagsOptions(
  variables?: GetTagsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetTagsQuery, Error, GetTagsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetTagsQuery, Error, GetTagsQuery, QueryKey> {
  return {
    queryKey: tagsKeys.list(variables) as unknown as QueryKey,
    queryFn: async () =>
      variables
        ? gqlClient.request<GetTagsQuery, GetTagsQueryVariables>(
            GetTagsDocument,
            variables
          )
        : gqlClient.request<GetTagsQuery>(GetTagsDocument),
    ...(options ?? {}),
  };
}

export function useGetTagsQuery(
  variables?: GetTagsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetTagsQuery, Error, GetTagsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetTagsOptions(variables, options));
}
