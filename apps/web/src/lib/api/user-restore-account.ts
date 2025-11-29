import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { gqlClient } from './client';
import {
  RequestAccountRestorationMutation,
  RequestAccountRestorationMutationVariables,
  RestoreMyAccountMutation,
  RestoreMyAccountMutationVariables,
} from './__generated__/react-query-update';

const REQUEST_ACCOUNT_RESTORATION = `
  mutation RequestAccountRestoration($email: String!) {
    requestAccountRestoration(email: $email)
  }
`;

const RESTORE_MY_ACCOUNT = `
  mutation RestoreMyAccount($email: String!, $token: String!) {
    restoreMyAccount(email: $email, token: $token)
  }
`;

export function useRequestAccountRestorationMutation(
  options?: UseMutationOptions<
    RequestAccountRestorationMutation,
    Error,
    RequestAccountRestorationMutationVariables
  >
) {
  return useMutation<
    RequestAccountRestorationMutation,
    Error,
    RequestAccountRestorationMutationVariables
  >({
    mutationFn: async (variables) => {
      return gqlClient.request<RequestAccountRestorationMutation>(
        REQUEST_ACCOUNT_RESTORATION,
        variables
      );
    },
    ...options,
  });
}

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
      return gqlClient.request<RestoreMyAccountMutation>(
        RESTORE_MY_ACCOUNT,
        variables
      );
    },
    ...options,
  });
}
