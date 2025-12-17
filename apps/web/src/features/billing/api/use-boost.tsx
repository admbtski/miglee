'use client';

import {
  UseBoostDocument,
  type UseBoostMutation,
  type UseBoostMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { billingKeys } from './billing-query-keys';

export function useBoost(
  options?: UseMutationOptions<
    UseBoostMutation,
    Error,
    UseBoostMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(UseBoostDocument, variables),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: billingKeys.eventSponsorship(variables.eventId),
      });
    },
    ...options,
  });
}
