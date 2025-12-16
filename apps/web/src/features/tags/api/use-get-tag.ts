// apps/web/src/hooks/tags.tsx
import {
  GetTagDocument,
  GetTagQuery,
  GetTagQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_TAG_ONE_KEY } from './tag-query-keys';

export function buildGetTagOptions(
  variables?: GetTagQueryVariables,
  options?: Omit<
    UseQueryOptions<GetTagQuery, unknown, GetTagQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetTagQuery, unknown, GetTagQuery, QueryKey> {
  return {
    queryKey: GET_TAG_ONE_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      variables
        ? gqlClient.request<GetTagQuery, GetTagQueryVariables>(
            GetTagDocument,
            variables
          )
        : gqlClient.request<GetTagQuery>(GetTagDocument),
    ...(options ?? {}),
  };
}

export function useGetTagQuery(
  variables: GetTagQueryVariables,
  options?: Omit<
    UseQueryOptions<GetTagQuery, Error, GetTagQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: GET_TAG_ONE_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<GetTagQuery, GetTagQueryVariables>(
        GetTagDocument,
        variables
      ),
    enabled: !!(variables.id || variables.slug),
    ...(options ?? {}),
  });
}
