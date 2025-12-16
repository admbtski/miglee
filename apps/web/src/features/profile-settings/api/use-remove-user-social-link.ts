'use client';

import {
  RemoveUserSocialLinkDocument,
  type RemoveUserSocialLinkMutation,
  type RemoveUserSocialLinkMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

export function useRemoveUserSocialLink(
  options?: UseMutationOptions<
    RemoveUserSocialLinkMutation,
    unknown,
    RemoveUserSocialLinkMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['RemoveUserSocialLink'],
    mutationFn: (variables: RemoveUserSocialLinkMutationVariables) =>
      gqlClient.request<
        RemoveUserSocialLinkMutation,
        RemoveUserSocialLinkMutationVariables
      >(RemoveUserSocialLinkDocument, variables),
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
      successMessage: 'Social link removed',
    },
    ...options,
  });
}
