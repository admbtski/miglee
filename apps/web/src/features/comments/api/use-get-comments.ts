'use client';

import {
  GetCommentsDocument,
  type GetCommentsQuery,
  type GetCommentsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { commentKeys } from './comment-query-keys';

export function useGetComments(
  variables: GetCommentsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCommentsQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetCommentsQuery, Error>({
    queryKey: commentKeys.list(variables),
    queryFn: async () => {
      const res = await gqlClient.request<GetCommentsQuery>(
        GetCommentsDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.eventId,
    ...options,
  });
}
