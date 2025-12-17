'use client';

import {
  GetUserPlanReceiptUrlDocument,
  type GetUserPlanReceiptUrlMutation,
  type GetUserPlanReceiptUrlMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

export function useGetUserPlanReceiptUrl(
  options?: UseMutationOptions<
    GetUserPlanReceiptUrlMutation,
    Error,
    GetUserPlanReceiptUrlMutationVariables
  >
) {
  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(GetUserPlanReceiptUrlDocument, variables),
    ...options,
  });
}
