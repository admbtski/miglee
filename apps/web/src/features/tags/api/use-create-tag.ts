// apps/web/src/hooks/tags.tsx
import {
  CreateTagDocument,
  CreateTagMutation,
  CreateTagMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';

export function buildCreateTagOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CreateTagMutation,
    unknown,
    CreateTagMutationVariables,
    TContext
  >
): UseMutationOptions<
  CreateTagMutation,
  unknown,
  CreateTagMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CreateTag'] as QueryKey,
    mutationFn: async (variables: CreateTagMutationVariables) =>
      gqlClient.request<CreateTagMutation, CreateTagMutationVariables>(
        CreateTagDocument,
        variables
      ),
    meta: {
      successMessage: 'Tag created successfully',
    },
    ...(options ?? {}),
  };
}

export function useCreateTagMutation(
  options?: UseMutationOptions<
    CreateTagMutation,
    unknown,
    CreateTagMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<CreateTagMutation, unknown, CreateTagMutationVariables>(
    buildCreateTagOptions({
      onSuccess: () => {
        // invalidate lists (including bySlugs)
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetTags',
        });
      },
      ...(options ?? {}),
    })
  );
}
