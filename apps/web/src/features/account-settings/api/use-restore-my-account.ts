import {
  RestoreMyAccountDocument,
  RestoreMyAccountMutation,
  RestoreMyAccountMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useRestoreMyAccountMutation(
  options?: UseMutationOptions<
    RestoreMyAccountMutation,
    Error,
    RestoreMyAccountMutationVariables
  >
) {
  return useMutation<
    RestoreMyAccountMutation,
    Error,
    RestoreMyAccountMutationVariables
  >({
    mutationFn: async (variables) => {
      return gqlClient.request<
        RestoreMyAccountMutation,
        RestoreMyAccountMutationVariables
      >(RestoreMyAccountDocument, variables);
    },
    ...options,
  });
}
