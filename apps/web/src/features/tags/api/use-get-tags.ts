import {
  GetTagsDocument,
  GetTagsQuery,
  GetTagsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { tagsKeys } from './tags-query-keys';

export function buildGetTagsOptions(
  variables: GetTagsQueryVariables = {},
  options?: Omit<
    UseQueryOptions<GetTagsQuery, Error, GetTagsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetTagsQuery, Error, GetTagsQuery, QueryKey> {
  return {
    queryKey: tagsKeys.list(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<GetTagsQuery, GetTagsQueryVariables>(
        GetTagsDocument,
        variables
      ),
    ...options,
  };
}

export function useGetTagsQuery(
  variables: GetTagsQueryVariables = {},
  options?: Omit<
    UseQueryOptions<GetTagsQuery, Error, GetTagsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetTagsQuery, Error, GetTagsQuery, QueryKey>(
    buildGetTagsOptions(variables, options)
  );
}
