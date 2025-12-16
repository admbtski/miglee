'use client';

import {
  UpdateUserProfileDocument,
  type UpdateUserProfileMutation,
  type UpdateUserProfileMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

export function useUpdateUserProfile(
  options?: UseMutationOptions<
    UpdateUserProfileMutation,
    unknown,
    UpdateUserProfileMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['UpdateUserProfile'],
    mutationFn: (variables: UpdateUserProfileMutationVariables) =>
      gqlClient.request<
        UpdateUserProfileMutation,
        UpdateUserProfileMutationVariables
      >(UpdateUserProfileDocument, variables),
    onSuccess: (data, variables) => {
      // Invalidate all user profile queries
      void queryClient.invalidateQueries({
        queryKey: ['UserProfile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['MyFullProfile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['Me'],
      });

      // Call parent onSuccess if provided
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, undefined, undefined);
      }
    },
    meta: {
      successMessage: 'Profile updated successfully',
    },
    ...options,
  });
}
