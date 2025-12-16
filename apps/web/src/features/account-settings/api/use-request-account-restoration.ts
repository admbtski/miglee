import {
  RequestAccountRestorationDocument,
  RequestAccountRestorationMutation,
  RequestAccountRestorationMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

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
      return gqlClient.request<
        RequestAccountRestorationMutation,
        RequestAccountRestorationMutationVariables
      >(RequestAccountRestorationDocument, variables);
    },
    ...options,
  });
}
