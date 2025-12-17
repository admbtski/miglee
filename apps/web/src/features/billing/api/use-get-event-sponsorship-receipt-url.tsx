'use client';

import {
  GetEventSponsorshipReceiptUrlDocument,
  type GetEventSponsorshipReceiptUrlMutation,
  type GetEventSponsorshipReceiptUrlMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

export function useGetEventSponsorshipReceiptUrl(
  options?: UseMutationOptions<
    GetEventSponsorshipReceiptUrlMutation,
    Error,
    GetEventSponsorshipReceiptUrlMutationVariables
  >
) {
  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(GetEventSponsorshipReceiptUrlDocument, variables),
    ...options,
  });
}
