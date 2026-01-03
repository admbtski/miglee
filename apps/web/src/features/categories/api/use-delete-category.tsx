import {
  DeleteCategoryDocument,
  DeleteCategoryMutation,
  DeleteCategoryMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { categoriesKeys } from './categories-query-keys';

export function buildDeleteCategoryOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteCategoryMutation,
    Error,
    DeleteCategoryMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteCategoryMutation,
  Error,
  DeleteCategoryMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DeleteCategory'] as QueryKey,
    mutationFn: async (variables: DeleteCategoryMutationVariables) =>
      gqlClient.request<
        DeleteCategoryMutation,
        DeleteCategoryMutationVariables
      >(DeleteCategoryDocument, variables),
    meta: {
      successMessage: 'Category deleted successfully',
    },
    ...(options ?? {}),
  };
}

export function useDeleteCategoryMutation(
  options?: UseMutationOptions<
    DeleteCategoryMutation,
    Error,
    DeleteCategoryMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    DeleteCategoryMutation,
    Error,
    DeleteCategoryMutationVariables
  >(
    buildDeleteCategoryOptions({
      onSuccess: (_data, vars) => {
        // Invalidate all categories queries (lists and details)
        qc.invalidateQueries({
          queryKey: categoriesKeys.all,
        });
        // Explicitly invalidate the deleted category detail
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: categoriesKeys.detail({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
