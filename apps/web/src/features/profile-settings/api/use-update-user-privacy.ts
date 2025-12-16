'use client';

import {
  UpdateUserPrivacyDocument,
  type UpdateUserPrivacyMutation,
  type UpdateUserPrivacyMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

export function useUpdateUserPrivacy(
  options?: UseMutationOptions<
    UpdateUserPrivacyMutation,
    unknown,
    UpdateUserPrivacyMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['UpdateUserPrivacy'],
    mutationFn: (variables: UpdateUserPrivacyMutationVariables) =>
      gqlClient.request<
        UpdateUserPrivacyMutation,
        UpdateUserPrivacyMutationVariables
      >(UpdateUserPrivacyDocument, variables),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['UserProfile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['MyFullProfile'],
      });

      // Call parent onSuccess if provided
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, undefined, undefined);
      }
    },
    meta: {
      successMessage: 'Privacy settings updated',
    },
    ...options,
  });
}
