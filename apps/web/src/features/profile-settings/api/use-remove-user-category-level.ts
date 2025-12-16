'use client';

import {
  RemoveUserCategoryLevelDocument,
  type RemoveUserCategoryLevelMutation,
  type RemoveUserCategoryLevelMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

export function useRemoveUserCategoryLevel(
  options?: UseMutationOptions<
    RemoveUserCategoryLevelMutation,
    unknown,
    RemoveUserCategoryLevelMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['RemoveUserCategoryLevel'],
    mutationFn: (variables: RemoveUserCategoryLevelMutationVariables) =>
      gqlClient.request<
        RemoveUserCategoryLevelMutation,
        RemoveUserCategoryLevelMutationVariables
      >(RemoveUserCategoryLevelDocument, variables),
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
      successMessage: 'Category level removed',
    },
    ...options,
  });
}
