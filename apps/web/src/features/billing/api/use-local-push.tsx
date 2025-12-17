'use client';

import {
  UseLocalPushDocument,
  type UseLocalPushMutation,
  type UseLocalPushMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { billingKeys } from './billing-query-keys';

export function useLocalPush(
  options?: UseMutationOptions<
    UseLocalPushMutation,
    Error,
    UseLocalPushMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(UseLocalPushDocument, variables),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: billingKeys.eventSponsorship(variables.eventId),
      });
    },
    ...options,
  });
}
