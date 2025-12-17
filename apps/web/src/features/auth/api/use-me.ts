import {
  GetMeDocument,
  GetMeQuery,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { authKeys } from './auth-query-keys';

export function buildMeOptions(
  options?: Omit<
    UseQueryOptions<GetMeQuery, unknown, GetMeQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetMeQuery, unknown, GetMeQuery, QueryKey> {
  return {
    queryKey: authKeys.me() as QueryKey,
    queryFn: async () => {
      return await gqlClient.request<GetMeQuery>(GetMeDocument);
    },
    ...(options ?? {}),
  };
}

export function useMeQuery(
  options?: Omit<
    UseQueryOptions<GetMeQuery, unknown, GetMeQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildMeOptions(options));
}
