import {
  CreateIntentDocument,
  CreateIntentMutation,
  CreateIntentMutationVariables,
  DeleteIntentDocument,
  DeleteIntentMutation,
  DeleteIntentMutationVariables,
  GetIntentDocument,
  GetIntentQuery,
  GetIntentQueryVariables,
  GetIntentsDocument,
  GetIntentsQuery,
  GetIntentsQuery_Query,
  GetIntentsQueryVariables,
  UpdateIntentDocument,
  UpdateIntentMutation,
  UpdateIntentMutationVariables,
  CancelIntentDocument,
  CancelIntentMutation,
  CancelIntentMutationVariables,
  CloseIntentJoinDocument,
  CloseIntentJoinMutation,
  CloseIntentJoinMutationVariables,
  ReopenIntentJoinDocument,
  ReopenIntentJoinMutation,
  ReopenIntentJoinMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  InfiniteData,
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

// hooks/intents.ts (dopisz obok istniejących)
import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';

/** Klucz cache dla infinite */
export const GET_INTENTS_INFINITE_KEY = (
  variables?: Omit<GetIntentsQueryVariables, 'offset'>
) =>
  variables
    ? (['GetIntentsInfinite', variables] as const)
    : (['GetIntentsInfinite'] as const);

/** Builder dla useInfiniteQuery */
export function buildGetIntentsInfiniteOptions(
  variables?: Omit<GetIntentsQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetIntentsQuery, // TQueryFnData
      Error, // TError
      InfiniteData<GetIntentsQuery>,
      QueryKey, // TQueryKey
      number // TPageParam (offset)
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
): UseInfiniteQueryOptions<
  GetIntentsQuery,
  Error,
  InfiniteData<GetIntentsQuery>,
  QueryKey,
  number
> {
  return {
    queryKey: GET_INTENTS_INFINITE_KEY(variables) as unknown as QueryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const vars: GetIntentsQueryVariables = {
        ...(variables ?? {}),
        offset: pageParam,
      };
      return variables
        ? gqlClient.request<GetIntentsQuery, GetIntentsQueryVariables>(
            GetIntentsDocument,
            vars
          )
        : gqlClient.request<GetIntentsQuery>(GetIntentsDocument);
    },
    getNextPageParam: (lastPage, _allPages, lastOffset) => {
      const res = lastPage.intents;

      if (res?.pageInfo) {
        const { hasNext, limit } = res.pageInfo as {
          hasNext: boolean;
          limit: number;
        };
        if (!hasNext) return undefined;
        const prev = (lastOffset ?? 0) as number;
        return prev + limit;
      }
      // Fallback — brak paginacji
      return undefined;
    },
    ...(options ?? {}),
  };
}

/** Publiczny hook (raw) — zwraca InfiniteData<GetIntentsQuery> */
export function useIntentsInfiniteQuery(
  variables?: Omit<GetIntentsQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetIntentsQuery,
      Error,
      InfiniteData<GetIntentsQuery>,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  return useInfiniteQuery<
    GetIntentsQuery,
    Error,
    InfiniteData<GetIntentsQuery>,
    QueryKey,
    number
  >(buildGetIntentsInfiniteOptions(variables, options));
}

export const flatIntentsPages = (pages?: GetIntentsQuery_Query[]) => {
  return pages?.flatMap((p) => p.intents) ?? [];
};

/* --------------------------------- KEYS ---------------------------------- */
export const GET_INTENTS_LIST_KEY = (variables?: GetIntentsQueryVariables) =>
  variables ? (['GetIntents', variables] as const) : (['GetIntents'] as const);

export const GET_INTENT_ONE_KEY = (variables: GetIntentQueryVariables) =>
  ['GetIntent', variables] as const;

/* ----------------------------- QUERY BUILDERS ---------------------------- */
export function buildGetIntentsOptions(
  variables?: GetIntentsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetIntentsQuery, Error, GetIntentsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetIntentsQuery, Error, GetIntentsQuery, QueryKey> {
  return {
    queryKey: GET_INTENTS_LIST_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      variables
        ? gqlClient.request<GetIntentsQuery, GetIntentsQueryVariables>(
            GetIntentsDocument,
            variables
          )
        : gqlClient.request<GetIntentsQuery>(GetIntentsDocument),
    ...(options ?? {}),
  };
}

export function buildGetIntentOptions(
  variables: GetIntentQueryVariables,
  options?: Omit<
    UseQueryOptions<GetIntentQuery, unknown, GetIntentQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetIntentQuery, unknown, GetIntentQuery, QueryKey> {
  return {
    queryKey: GET_INTENT_ONE_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<GetIntentQuery, GetIntentQueryVariables>(
        GetIntentDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

/* --------------------------------- QUERIES -------------------------------- */
export function useIntentsQuery(
  variables?: GetIntentsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetIntentsQuery, Error, GetIntentsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetIntentsOptions(variables, options));
}

export function useIntentQuery(
  variables: GetIntentQueryVariables,
  options?: Omit<
    UseQueryOptions<GetIntentQuery, unknown, GetIntentQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetIntentOptions(variables, {
      enabled: !!variables.id, // schema wymaga id; jeśli dodasz lookup po slug, dostosuj
      ...(options ?? {}),
    })
  );
}

/* --------------------------- MUTATION BUILDERS --------------------------- */
export function buildCreateIntentOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CreateIntentMutation,
    unknown,
    CreateIntentMutationVariables,
    TContext
  >
): UseMutationOptions<
  CreateIntentMutation,
  unknown,
  CreateIntentMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CreateIntent'] as QueryKey,
    mutationFn: async (variables: CreateIntentMutationVariables) =>
      gqlClient.request<CreateIntentMutation, CreateIntentMutationVariables>(
        CreateIntentDocument,
        variables
      ),
    meta: {
      successMessage: 'Event created successfully',
    },
    ...(options ?? {}),
  };
}

export function buildUpdateIntentOptions<TContext = unknown>(
  options?: UseMutationOptions<
    UpdateIntentMutation,
    unknown,
    UpdateIntentMutationVariables,
    TContext
  >
): UseMutationOptions<
  UpdateIntentMutation,
  unknown,
  UpdateIntentMutationVariables,
  TContext
> {
  return {
    mutationKey: ['UpdateIntent'] as QueryKey,
    mutationFn: async (variables: UpdateIntentMutationVariables) =>
      gqlClient.request<UpdateIntentMutation, UpdateIntentMutationVariables>(
        UpdateIntentDocument,
        variables
      ),
    meta: {
      successMessage: 'Event updated successfully',
    },
    ...(options ?? {}),
  };
}

export function buildDeleteIntentOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteIntentMutation,
    unknown,
    DeleteIntentMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteIntentMutation,
  unknown,
  DeleteIntentMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DeleteIntent'] as QueryKey,
    mutationFn: async (variables: DeleteIntentMutationVariables) =>
      gqlClient.request<DeleteIntentMutation, DeleteIntentMutationVariables>(
        DeleteIntentDocument,
        variables
      ),
    meta: {
      successMessage: 'Event deleted successfully',
    },
    ...(options ?? {}),
  };
}

// NEW: cancelIntent builder
export function buildCancelIntentOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CancelIntentMutation,
    unknown,
    CancelIntentMutationVariables,
    TContext
  >
): UseMutationOptions<
  CancelIntentMutation,
  unknown,
  CancelIntentMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CancelIntent'] as QueryKey,
    mutationFn: async (variables: CancelIntentMutationVariables) =>
      gqlClient.request<CancelIntentMutation, CancelIntentMutationVariables>(
        CancelIntentDocument,
        variables
      ),
    meta: {
      successMessage: 'Event cancelled successfully',
    },
    ...(options ?? {}),
  };
}

// NEW: closeIntentJoin builder
export function buildCloseIntentJoinOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CloseIntentJoinMutation,
    unknown,
    CloseIntentJoinMutationVariables,
    TContext
  >
): UseMutationOptions<
  CloseIntentJoinMutation,
  unknown,
  CloseIntentJoinMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CloseIntentJoin'] as QueryKey,
    mutationFn: async (variables: CloseIntentJoinMutationVariables) =>
      gqlClient.request<
        CloseIntentJoinMutation,
        CloseIntentJoinMutationVariables
      >(CloseIntentJoinDocument, variables),
    meta: {
      successMessage: 'Zapisy zamknięte pomyślnie',
    },
    ...(options ?? {}),
  };
}

// NEW: reopenIntentJoin builder
export function buildReopenIntentJoinOptions<TContext = unknown>(
  options?: UseMutationOptions<
    ReopenIntentJoinMutation,
    unknown,
    ReopenIntentJoinMutationVariables,
    TContext
  >
): UseMutationOptions<
  ReopenIntentJoinMutation,
  unknown,
  ReopenIntentJoinMutationVariables,
  TContext
> {
  return {
    mutationKey: ['ReopenIntentJoin'] as QueryKey,
    mutationFn: async (variables: ReopenIntentJoinMutationVariables) =>
      gqlClient.request<
        ReopenIntentJoinMutation,
        ReopenIntentJoinMutationVariables
      >(ReopenIntentJoinDocument, variables),
    meta: {
      successMessage: 'Zapisy otwarte ponownie',
    },
    ...(options ?? {}),
  };
}

/* -------------------------------- MUTATIONS ------------------------------- */
export function useCreateIntentMutation(
  options?: UseMutationOptions<
    CreateIntentMutation,
    unknown,
    CreateIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CreateIntentMutation,
    unknown,
    CreateIntentMutationVariables
  >(
    buildCreateIntentOptions({
      onSuccess: (_data, _vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useUpdateIntentMutation(
  options?: UseMutationOptions<
    UpdateIntentMutation,
    unknown,
    UpdateIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UpdateIntentMutation,
    unknown,
    UpdateIntentMutationVariables
  >(
    buildUpdateIntentOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useDeleteIntentMutation(
  options?: UseMutationOptions<
    DeleteIntentMutation,
    unknown,
    DeleteIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    DeleteIntentMutation,
    unknown,
    DeleteIntentMutationVariables
  >(
    buildDeleteIntentOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

// NEW: cancelIntent hook
export function useCancelIntentMutation(
  options?: UseMutationOptions<
    CancelIntentMutation,
    unknown,
    CancelIntentMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CancelIntentMutation,
    unknown,
    CancelIntentMutationVariables
  >(
    buildCancelIntentOptions({
      onSuccess: (_data, vars) => {
        // odśwież listy i szczegół
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

// NEW: closeIntentJoin hook
export function useCloseIntentJoinMutation(
  options?: UseMutationOptions<
    CloseIntentJoinMutation,
    unknown,
    CloseIntentJoinMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CloseIntentJoinMutation,
    unknown,
    CloseIntentJoinMutationVariables
  >(
    buildCloseIntentJoinOptions({
      onSuccess: (_data, vars) => {
        // odśwież listy i szczegół
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
        if (vars.intentId) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: vars.intentId,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

// NEW: reopenIntentJoin hook
export function useReopenIntentJoinMutation(
  options?: UseMutationOptions<
    ReopenIntentJoinMutation,
    unknown,
    ReopenIntentJoinMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    ReopenIntentJoinMutation,
    unknown,
    ReopenIntentJoinMutationVariables
  >(
    buildReopenIntentJoinOptions({
      onSuccess: (_data, vars) => {
        // odśwież listy i szczegół
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetIntents',
        });
        if (vars.intentId) {
          qc.invalidateQueries({
            queryKey: GET_INTENT_ONE_KEY({
              id: vars.intentId,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
