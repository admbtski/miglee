import {
  RotateMemberCheckinTokenDocument,
  RotateMemberCheckinTokenMutation,
  RotateMemberCheckinTokenMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useRotateMemberCheckinTokenMutation(
  options?: UseMutationOptions<
    RotateMemberCheckinTokenMutation,
    Error,
    RotateMemberCheckinTokenMutationVariables
  >
) {
  return useMutation<
    RotateMemberCheckinTokenMutation,
    Error,
    RotateMemberCheckinTokenMutationVariables
  >({
    mutationKey: ['RotateMemberCheckinToken'],
    mutationFn: async (variables) =>
      gqlClient.request<
        RotateMemberCheckinTokenMutation,
        RotateMemberCheckinTokenMutationVariables
      >(RotateMemberCheckinTokenDocument, variables),
    ...options,
  });
}
