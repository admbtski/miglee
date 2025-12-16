'use client';

import {
  UpsertUserCategoryLevelDocument,
  type UpsertUserCategoryLevelMutation,
  type UpsertUserCategoryLevelMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

export function useUpsertUserCategoryLevel(
  options?: UseMutationOptions<
    UpsertUserCategoryLevelMutation,
    unknown,
    UpsertUserCategoryLevelMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['UpsertUserCategoryLevel'],
    mutationFn: (variables: UpsertUserCategoryLevelMutationVariables) =>
      gqlClient.request<
        UpsertUserCategoryLevelMutation,
        UpsertUserCategoryLevelMutationVariables
      >(UpsertUserCategoryLevelDocument, variables),
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
      successMessage: (variables: any) =>
        variables?.input?.id
          ? 'Category level updated'
          : 'Category level added',
    },
    ...options,
  });
}
