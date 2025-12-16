import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { gqlClient } from '@/lib/api/client';
import {
  DeleteMyAccountMutation,
  DeleteMyAccountMutationVariables,
} from '@/lib/api/__generated__/react-query-update';

const DELETE_MY_ACCOUNT = `
  mutation DeleteMyAccount($reason: String) {
    deleteMyAccount(reason: $reason)
  }
`;

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
      return gqlClient.request<DeleteMyAccountMutation>(
        DELETE_MY_ACCOUNT,
        variables
      );
    },
    ...options,
  });
}
