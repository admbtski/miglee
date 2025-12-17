'use client';

import {
  ReactivateSubscriptionDocument,
  type ReactivateSubscriptionMutation,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { billingKeys } from './billing-query-keys';

export function useReactivateSubscription(
  options?: UseMutationOptions<ReactivateSubscriptionMutation, Error, void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => gqlClient.request(ReactivateSubscriptionDocument),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.mySubscription() });
    },
    ...options,
  });
}
