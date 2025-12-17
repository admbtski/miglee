'use client';

import {
  CreateEventSponsorshipCheckoutDocument,
  type CreateEventSponsorshipCheckoutMutation,
  type CreateEventSponsorshipCheckoutMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { billingKeys } from './billing-query-keys';

export function useCreateEventSponsorshipCheckout(
  options?: UseMutationOptions<
    CreateEventSponsorshipCheckoutMutation,
    Error,
    CreateEventSponsorshipCheckoutMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(CreateEventSponsorshipCheckoutDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate event sponsorship query
      if (variables.input.eventId) {
        queryClient.invalidateQueries({
          queryKey: billingKeys.eventSponsorship(variables.input.eventId),
        });
      }
    },
    ...options,
  });
}
