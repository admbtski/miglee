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
import { GET_CATEGORY_ONE_KEY } from './category-query-keys';

export function buildDeleteCategoryOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteCategoryMutation,
    unknown,
    DeleteCategoryMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteCategoryMutation,
  unknown,
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
    unknown,
    DeleteCategoryMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    DeleteCategoryMutation,
    unknown,
    DeleteCategoryMutationVariables
  >(
    buildDeleteCategoryOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetCategories',
        });

        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_CATEGORY_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
