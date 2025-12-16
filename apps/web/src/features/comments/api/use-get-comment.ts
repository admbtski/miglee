'use client';

import {
  GetCommentDocument,
  type GetCommentQuery,
  type GetCommentQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { commentKeys } from './comment-query-keys';

export function useGetComment(
  variables: GetCommentQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCommentQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetCommentQuery, Error>({
    queryKey: commentKeys.detail(variables.id),
    queryFn: async () => {
      const res = await gqlClient.request<GetCommentQuery>(
        GetCommentDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.id,
    ...options,
  });
}
