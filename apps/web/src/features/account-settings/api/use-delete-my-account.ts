import {
  DeleteMyAccountMutation,
  DeleteMyAccountMutationVariables,
  UpdateUserPrivacyDocument,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

export function useDeleteMyAccountMutation(
  options?: UseMutationOptions<
    DeleteMyAccountMutation,
    Error,
    DeleteMyAccountMutationVariables
  >
) {
  return useMutation<
    DeleteMyAccountMutation,
    Error,
    DeleteMyAccountMutationVariables
  >({
    mutationFn: async (variables) => {
      return gqlClient.request<
        DeleteMyAccountMutation,
        DeleteMyAccountMutationVariables
      >(UpdateUserPrivacyDocument, variables);
    },
    ...options,
  });
}
