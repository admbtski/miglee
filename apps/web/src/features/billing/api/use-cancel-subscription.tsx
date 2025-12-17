'use client';

import {
  CancelSubscriptionDocument,
  type CancelSubscriptionMutation,
  type CancelSubscriptionMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { billingKeys } from './billing-query-keys';

export function useCancelSubscription(
  options?: UseMutationOptions<
    CancelSubscriptionMutation,
    Error,
    CancelSubscriptionMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(CancelSubscriptionDocument, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.mySubscription() });
    },
    ...options,
  });
}
