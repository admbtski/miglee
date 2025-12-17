'use client';

import {
  CreateOneOffCheckoutDocument,
  type CreateOneOffCheckoutMutation,
  type CreateOneOffCheckoutMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { billingKeys } from './billing-query-keys';

export function useCreateOneOffCheckout(
  options?: UseMutationOptions<
    CreateOneOffCheckoutMutation,
    Error,
    CreateOneOffCheckoutMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(CreateOneOffCheckoutDocument, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.myPlan() });
      queryClient.invalidateQueries({ queryKey: billingKeys.myPlanPeriods() });
    },
    ...options,
  });
}
