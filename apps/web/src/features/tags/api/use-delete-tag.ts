// apps/web/src/hooks/tags.tsx
import {
  DeleteTagDocument,
  DeleteTagMutation,
  DeleteTagMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { tagsKeys } from './tags-query-keys';

export function buildDeleteTagOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteTagMutation,
    unknown,
    DeleteTagMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteTagMutation,
  unknown,
  DeleteTagMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DeleteTag'] as QueryKey,
    mutationFn: async (variables: DeleteTagMutationVariables) =>
      gqlClient.request<DeleteTagMutation, DeleteTagMutationVariables>(
        DeleteTagDocument,
        variables
      ),
    meta: {
      successMessage: 'Tag deleted successfully',
    },
    ...(options ?? {}),
  };
}

export function useDeleteTagMutation(
  options?: UseMutationOptions<
    DeleteTagMutation,
    unknown,
    DeleteTagMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<DeleteTagMutation, unknown, DeleteTagMutationVariables>(
    buildDeleteTagOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetTags',
        });
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: tagsKeys.detail({ id: vars.id }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
