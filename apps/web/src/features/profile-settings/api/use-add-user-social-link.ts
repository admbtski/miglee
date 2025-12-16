'use client';

import {
  AddUserSocialLinkDocument,
  type AddUserSocialLinkMutation,
  type AddUserSocialLinkMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

export function useAddUserSocialLink(
  options?: UseMutationOptions<
    AddUserSocialLinkMutation,
    unknown,
    AddUserSocialLinkMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['AddUserSocialLink'],
    mutationFn: (variables: AddUserSocialLinkMutationVariables) =>
      gqlClient.request<
        AddUserSocialLinkMutation,
        AddUserSocialLinkMutationVariables
      >(AddUserSocialLinkDocument, variables),
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
      successMessage: 'Social link added',
    },
    ...options,
  });
}
