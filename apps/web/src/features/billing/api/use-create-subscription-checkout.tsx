'use client';

import {
  CreateSubscriptionCheckoutDocument,
  type CreateSubscriptionCheckoutMutation,
  type CreateSubscriptionCheckoutMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { billingKeys } from './billing-query-keys';

export function useCreateSubscriptionCheckout(
  options?: UseMutationOptions<
    CreateSubscriptionCheckoutMutation,
    Error,
    CreateSubscriptionCheckoutMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(CreateSubscriptionCheckoutDocument, variables),
    onSuccess: () => {
      // Invalidate billing queries after successful checkout creation
      queryClient.invalidateQueries({ queryKey: billingKeys.myPlan() });
      queryClient.invalidateQueries({ queryKey: billingKeys.mySubscription() });
      queryClient.invalidateQueries({ queryKey: billingKeys.myPlanPeriods() });
    },
    ...options,
  });
}
