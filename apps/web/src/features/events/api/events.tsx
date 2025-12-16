import {
  CreateEventDocument,
  CreateEventMutation,
  CreateEventMutationVariables,
  DeleteEventDocument,
  DeleteEventMutation,
  DeleteEventMutationVariables,
  GetEventsDocument,
  GetEventsQuery,
  GetEventsQuery_Query,
  GetEventsQueryVariables,
  GetEventsListingDocument,
  GetEventsListingQuery,
  GetEventsListingQueryVariables,
  UpdateEventDocument,
  UpdateEventMutation,
  UpdateEventMutationVariables,
  CancelEventDocument,
  CancelEventMutation,
  CancelEventMutationVariables,
  CloseEventJoinDocument,
  CloseEventJoinMutation,
  CloseEventJoinMutationVariables,
  ReopenEventJoinDocument,
  ReopenEventJoinMutation,
  ReopenEventJoinMutationVariables,
  GetEventDetailDocument,
  GetEventDetailQuery,
  GetEventDetailQueryVariables,
  UpdateEventFaqsDocument,
  UpdateEventFaqsMutation,
  UpdateEventFaqsMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gql } from 'graphql-request';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  InfiniteData,
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';

/* -------------------------------- TYPES ---------------------------------- */
// GetEventDetailQuery is now imported directly from generated types

/** Klucz cache dla infinite - zoptymalizowana wersja (GetEventsListing) */
export const GET_EVENTS_LISTING_INFINITE_KEY = (
  variables?: Omit<GetEventsListingQueryVariables, 'offset'>
) =>
  variables
    ? (['GetEventsListingInfinite', variables] as const)
    : (['GetEventsListingInfinite'] as const);

/** Klucz cache dla infinite */
export const GET_EVENTS_INFINITE_KEY = (
  variables?: Omit<GetEventsQueryVariables, 'offset'>
) =>
  variables
    ? (['GetEventsInfinite', variables] as const)
    : (['GetEventsInfinite'] as const);

/** Builder dla useInfiniteQuery - zoptymalizowana wersja (GetEventsListing) */
export function buildGetEventsListingInfiniteOptions(
  variables?: Omit<GetEventsListingQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetEventsListingQuery, // TQueryFnData
      Error, // TError
      InfiniteData<GetEventsListingQuery>,
      QueryKey, // TQueryKey
      number // TPageParam (offset)
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
): UseInfiniteQueryOptions<
  GetEventsListingQuery,
  Error,
  InfiniteData<GetEventsListingQuery>,
  QueryKey,
  number
> {
  return {
    queryKey: GET_EVENTS_LISTING_INFINITE_KEY(variables) as unknown as QueryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const vars: GetEventsListingQueryVariables = {
        ...(variables ?? {}),
        offset: pageParam,
      };
      return variables
        ? gqlClient.request<
            GetEventsListingQuery,
            GetEventsListingQueryVariables
          >(GetEventsListingDocument, vars)
        : gqlClient.request<GetEventsListingQuery>(GetEventsListingDocument);
    },
    getNextPageParam: (lastPage, _allPages, lastOffset) => {
      const res = lastPage.events;

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

/** Builder dla useInfiniteQuery */
export function buildGetEventsInfiniteOptions(
  variables?: Omit<GetEventsQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetEventsQuery, // TQueryFnData
      Error, // TError
      InfiniteData<GetEventsQuery>,
      QueryKey, // TQueryKey
      number // TPageParam (offset)
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
): UseInfiniteQueryOptions<
  GetEventsQuery,
  Error,
  InfiniteData<GetEventsQuery>,
  QueryKey,
  number
> {
  return {
    queryKey: GET_EVENTS_INFINITE_KEY(variables) as unknown as QueryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const vars: GetEventsQueryVariables = {
        ...(variables ?? {}),
        offset: pageParam,
      };
      return variables
        ? gqlClient.request<GetEventsQuery, GetEventsQueryVariables>(
            GetEventsDocument,
            vars
          )
        : gqlClient.request<GetEventsQuery>(GetEventsDocument);
    },
    getNextPageParam: (lastPage, _allPages, lastOffset) => {
      const res = lastPage.events;

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

/** Publiczny hook (zoptymalizowany) — zwraca InfiniteData<GetEventsListingQuery> */
export function useEventsListingInfiniteQuery(
  variables?: Omit<GetEventsListingQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetEventsListingQuery,
      Error,
      InfiniteData<GetEventsListingQuery>,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  return useInfiniteQuery<
    GetEventsListingQuery,
    Error,
    InfiniteData<GetEventsListingQuery>,
    QueryKey,
    number
  >(buildGetEventsListingInfiniteOptions(variables, options));
}

/** Publiczny hook (raw) — zwraca InfiniteData<GetEventsQuery> */
export function useEventsInfiniteQuery(
  variables?: Omit<GetEventsQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetEventsQuery,
      Error,
      InfiniteData<GetEventsQuery>,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  return useInfiniteQuery<
    GetEventsQuery,
    Error,
    InfiniteData<GetEventsQuery>,
    QueryKey,
    number
  >(buildGetEventsInfiniteOptions(variables, options));
}

export const flatEventsPages = (pages?: GetEventsQuery_Query[]) => {
  return pages?.flatMap((p) => p.events) ?? [];
};

/* --------------------------------- KEYS ---------------------------------- */
export const GET_EVENTS_LIST_KEY = (variables?: GetEventsQueryVariables) =>
  variables ? (['GetEvents', variables] as const) : (['GetEvents'] as const);

export const GET_EVENT_DETAIL_KEY = (variables: GetEventDetailQueryVariables) =>
  ['GetEventDetail', variables] as const;

/* --------------------------- GRAPHQL DOCUMENTS --------------------------- */
/**
 * Complete event detail query with all fields
 * Includes sponsorship, inviteLinks, and computed helpers
 */

/* ----------------------------- QUERY BUILDERS ---------------------------- */
export function buildGetEventsOptions(
  variables?: GetEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetEventsQuery, Error, GetEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetEventsQuery, Error, GetEventsQuery, QueryKey> {
  return {
    queryKey: GET_EVENTS_LIST_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      variables
        ? gqlClient.request<GetEventsQuery, GetEventsQueryVariables>(
            GetEventsDocument,
            variables
          )
        : gqlClient.request<GetEventsQuery>(GetEventsDocument),
    ...(options ?? {}),
  };
}

export function buildGetEventDetailOptions(
  variables: GetEventDetailQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventDetailQuery,
      unknown,
      GetEventDetailQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetEventDetailQuery,
  unknown,
  GetEventDetailQuery,
  QueryKey
> {
  return {
    queryKey: GET_EVENT_DETAIL_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<GetEventDetailQuery, GetEventDetailQueryVariables>(
        GetEventDetailDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

/* --------------------------------- QUERIES -------------------------------- */
export function useEventsQuery(
  variables?: GetEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetEventsQuery, Error, GetEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventsOptions(variables, options));
}

/**
 * Fetch complete event details by ID
 * Includes sponsorship, inviteLinks, members, faqs, joinQuestions, agendaItems and all computed helpers
 * This is the unified query for all event detail needs - replaces the old useEventQuery
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useEventDetailQuery({ id: 'event-123' });
 * const event = data?.event;
 * ```
 */
export function useEventDetailQuery(
  variables: GetEventDetailQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventDetailQuery,
      unknown,
      GetEventDetailQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetEventDetailOptions(variables, {
      enabled: !!variables.id,
      ...(options ?? {}),
    })
  );
}

/* --------------------------- MUTATION BUILDERS --------------------------- */
export function buildCreateEventOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CreateEventMutation,
    unknown,
    CreateEventMutationVariables,
    TContext
  >
): UseMutationOptions<
  CreateEventMutation,
  unknown,
  CreateEventMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CreateEvent'] as QueryKey,
    mutationFn: async (variables: CreateEventMutationVariables) =>
      gqlClient.request<CreateEventMutation, CreateEventMutationVariables>(
        CreateEventDocument,
        variables
      ),
    meta: {
      successMessage: 'Event created successfully',
    },
    ...(options ?? {}),
  };
}

export function buildUpdateEventOptions<TContext = unknown>(
  options?: UseMutationOptions<
    UpdateEventMutation,
    unknown,
    UpdateEventMutationVariables,
    TContext
  >
): UseMutationOptions<
  UpdateEventMutation,
  unknown,
  UpdateEventMutationVariables,
  TContext
> {
  return {
    mutationKey: ['UpdateEvent'] as QueryKey,
    mutationFn: async (variables: UpdateEventMutationVariables) =>
      gqlClient.request<UpdateEventMutation, UpdateEventMutationVariables>(
        UpdateEventDocument,
        variables
      ),
    meta: {
      successMessage: 'Event updated successfully',
    },
    ...(options ?? {}),
  };
}

export function buildDeleteEventOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteEventMutation,
    unknown,
    DeleteEventMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteEventMutation,
  unknown,
  DeleteEventMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DeleteEvent'] as QueryKey,
    mutationFn: async (variables: DeleteEventMutationVariables) =>
      gqlClient.request<DeleteEventMutation, DeleteEventMutationVariables>(
        DeleteEventDocument,
        variables
      ),
    meta: {
      successMessage: 'Event deleted successfully',
    },
    ...(options ?? {}),
  };
}

// NEW: cancelEvent builder
export function buildCancelEventOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CancelEventMutation,
    unknown,
    CancelEventMutationVariables,
    TContext
  >
): UseMutationOptions<
  CancelEventMutation,
  unknown,
  CancelEventMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CancelEvent'] as QueryKey,
    mutationFn: async (variables: CancelEventMutationVariables) =>
      gqlClient.request<CancelEventMutation, CancelEventMutationVariables>(
        CancelEventDocument,
        variables
      ),
    meta: {
      successMessage: 'Event cancelled successfully',
    },
    ...(options ?? {}),
  };
}

// NEW: closeEventJoin builder
export function buildCloseEventJoinOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CloseEventJoinMutation,
    unknown,
    CloseEventJoinMutationVariables,
    TContext
  >
): UseMutationOptions<
  CloseEventJoinMutation,
  unknown,
  CloseEventJoinMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CloseEventJoin'] as QueryKey,
    mutationFn: async (variables: CloseEventJoinMutationVariables) =>
      gqlClient.request<
        CloseEventJoinMutation,
        CloseEventJoinMutationVariables
      >(CloseEventJoinDocument, variables),
    meta: {
      successMessage: 'Zapisy zamknięte pomyślnie',
    },
    ...(options ?? {}),
  };
}

// NEW: reopenEventJoin builder
export function buildReopenEventJoinOptions<TContext = unknown>(
  options?: UseMutationOptions<
    ReopenEventJoinMutation,
    unknown,
    ReopenEventJoinMutationVariables,
    TContext
  >
): UseMutationOptions<
  ReopenEventJoinMutation,
  unknown,
  ReopenEventJoinMutationVariables,
  TContext
> {
  return {
    mutationKey: ['ReopenEventJoin'] as QueryKey,
    mutationFn: async (variables: ReopenEventJoinMutationVariables) =>
      gqlClient.request<
        ReopenEventJoinMutation,
        ReopenEventJoinMutationVariables
      >(ReopenEventJoinDocument, variables),
    meta: {
      successMessage: 'Zapisy otwarte ponownie',
    },
    ...(options ?? {}),
  };
}

/* -------------------------------- MUTATIONS ------------------------------- */
export function useCreateEventMutation(
  options?: UseMutationOptions<
    CreateEventMutation,
    unknown,
    CreateEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CreateEventMutation,
    unknown,
    CreateEventMutationVariables
  >(
    buildCreateEventOptions({
      onSuccess: (_data, _vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useUpdateEventMutation(
  options?: UseMutationOptions<
    UpdateEventMutation,
    unknown,
    UpdateEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UpdateEventMutation,
    unknown,
    UpdateEventMutationVariables
  >(
    buildUpdateEventOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useDeleteEventMutation(
  options?: UseMutationOptions<
    DeleteEventMutation,
    unknown,
    DeleteEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    DeleteEventMutation,
    unknown,
    DeleteEventMutationVariables
  >(
    buildDeleteEventOptions({
      onSuccess: (_data, vars) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

// NEW: cancelEvent hook
export function useCancelEventMutation(
  options?: UseMutationOptions<
    CancelEventMutation,
    unknown,
    CancelEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CancelEventMutation,
    unknown,
    CancelEventMutationVariables
  >(
    buildCancelEventOptions({
      onSuccess: (_data, vars) => {
        // odśwież listy i szczegół
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

// NEW: closeEventJoin hook
export function useCloseEventJoinMutation(
  options?: UseMutationOptions<
    CloseEventJoinMutation,
    unknown,
    CloseEventJoinMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CloseEventJoinMutation,
    unknown,
    CloseEventJoinMutationVariables
  >(
    buildCloseEventJoinOptions({
      onSuccess: (_data, vars) => {
        // odśwież listy i szczegół
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
        if (vars.eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: vars.eventId,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

// NEW: reopenEventJoin hook
export function useReopenEventJoinMutation(
  options?: UseMutationOptions<
    ReopenEventJoinMutation,
    unknown,
    ReopenEventJoinMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    ReopenEventJoinMutation,
    unknown,
    ReopenEventJoinMutationVariables
  >(
    buildReopenEventJoinOptions({
      onSuccess: (_data, vars) => {
        // odśwież listy i szczegół
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
        if (vars.eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: vars.eventId,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

// FAQ Management
export function useUpdateEventFaqsMutation(
  options?: UseMutationOptions<
    UpdateEventFaqsMutation,
    Error,
    UpdateEventFaqsMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UpdateEventFaqsMutation,
    Error,
    UpdateEventFaqsMutationVariables
  >({
    mutationKey: ['UpdateEventFaqs'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UpdateEventFaqsMutation>(
        UpdateEventFaqsDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'FAQ updated successfully',
    },
    onSuccess: (_data, variables) => {
      // Invalidate event detail query to refetch with updated FAQs
      if (variables.input.eventId) {
        qc.invalidateQueries({
          queryKey: GET_EVENT_DETAIL_KEY({
            id: variables.input.eventId,
          }) as unknown as QueryKey,
        });
      }
    },
    ...options,
  });
}

/* ----------------------------- PUBLICATION MUTATIONS ----------------------------- */

// Temporary types until codegen runs
type PublishEventMutation = { publishEvent: GetEventDetailQuery['event'] };
type PublishEventMutationVariables = { id: string };
type ScheduleEventPublicationMutation = {
  scheduleEventPublication: GetEventDetailQuery['event'];
};
type ScheduleEventPublicationMutationVariables = {
  id: string;
  publishAt: string;
};
type CancelScheduledPublicationMutation = {
  cancelScheduledPublication: GetEventDetailQuery['event'];
};
type CancelScheduledPublicationMutationVariables = { id: string };
type UnpublishEventMutation = { unpublishEvent: GetEventDetailQuery['event'] };
type UnpublishEventMutationVariables = { id: string };

// Temporary documents until codegen runs
const PublishEventDocument = gql`
  mutation PublishEvent($id: ID!) {
    publishEvent(id: $id) {
      id
      publicationStatus
      publishedAt
      scheduledPublishAt
    }
  }
`;

const ScheduleEventPublicationDocument = gql`
  mutation ScheduleEventPublication($id: ID!, $publishAt: DateTime!) {
    scheduleEventPublication(id: $id, publishAt: $publishAt) {
      id
      publicationStatus
      publishedAt
      scheduledPublishAt
    }
  }
`;

const CancelScheduledPublicationDocument = gql`
  mutation CancelScheduledPublication($id: ID!) {
    cancelScheduledPublication(id: $id) {
      id
      publicationStatus
      publishedAt
      scheduledPublishAt
    }
  }
`;

const UnpublishEventDocument = gql`
  mutation UnpublishEvent($id: ID!) {
    unpublishEvent(id: $id) {
      id
      publicationStatus
      publishedAt
      scheduledPublishAt
    }
  }
`;

// Publish Event immediately
export function usePublishEventMutation(
  options?: UseMutationOptions<
    PublishEventMutation,
    unknown,
    PublishEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    PublishEventMutation,
    unknown,
    PublishEventMutationVariables
  >({
    mutationKey: ['PublishEvent'],
    mutationFn: async (variables) =>
      gqlClient.request<PublishEventMutation, PublishEventMutationVariables>(
        PublishEventDocument as unknown as TypedDocumentNode<
          PublishEventMutation,
          PublishEventMutationVariables
        >,
        variables
      ),
    meta: {
      successMessage: 'Event published successfully',
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
      });
      if (vars.id) {
        qc.invalidateQueries({
          queryKey: GET_EVENT_DETAIL_KEY({
            id: vars.id,
          }) as unknown as QueryKey,
        });
      }
    },
    ...options,
  });
}

// Schedule Event publication
export function useScheduleEventPublicationMutation(
  options?: UseMutationOptions<
    ScheduleEventPublicationMutation,
    unknown,
    ScheduleEventPublicationMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    ScheduleEventPublicationMutation,
    unknown,
    ScheduleEventPublicationMutationVariables
  >({
    mutationKey: ['ScheduleEventPublication'],
    mutationFn: async (variables) =>
      gqlClient.request<
        ScheduleEventPublicationMutation,
        ScheduleEventPublicationMutationVariables
      >(
        ScheduleEventPublicationDocument as unknown as TypedDocumentNode<
          ScheduleEventPublicationMutation,
          ScheduleEventPublicationMutationVariables
        >,
        variables
      ),
    meta: {
      successMessage: 'Publication scheduled successfully',
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
      });
      if (vars.id) {
        qc.invalidateQueries({
          queryKey: GET_EVENT_DETAIL_KEY({
            id: vars.id,
          }) as unknown as QueryKey,
        });
      }
    },
    ...options,
  });
}

// Cancel scheduled publication
export function useCancelScheduledPublicationMutation(
  options?: UseMutationOptions<
    CancelScheduledPublicationMutation,
    unknown,
    CancelScheduledPublicationMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CancelScheduledPublicationMutation,
    unknown,
    CancelScheduledPublicationMutationVariables
  >({
    mutationKey: ['CancelScheduledPublication'],
    mutationFn: async (variables) =>
      gqlClient.request<
        CancelScheduledPublicationMutation,
        CancelScheduledPublicationMutationVariables
      >(
        CancelScheduledPublicationDocument as unknown as TypedDocumentNode<
          CancelScheduledPublicationMutation,
          CancelScheduledPublicationMutationVariables
        >,
        variables
      ),
    meta: {
      successMessage: 'Scheduled publication cancelled',
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
      });
      if (vars.id) {
        qc.invalidateQueries({
          queryKey: GET_EVENT_DETAIL_KEY({
            id: vars.id,
          }) as unknown as QueryKey,
        });
      }
    },
    ...options,
  });
}

// Unpublish Event
export function useUnpublishEventMutation(
  options?: UseMutationOptions<
    UnpublishEventMutation,
    unknown,
    UnpublishEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UnpublishEventMutation,
    unknown,
    UnpublishEventMutationVariables
  >({
    mutationKey: ['UnpublishEvent'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UnpublishEventMutation,
        UnpublishEventMutationVariables
      >(
        UnpublishEventDocument as unknown as TypedDocumentNode<
          UnpublishEventMutation,
          UnpublishEventMutationVariables
        >,
        variables
      ),
    meta: {
      successMessage: 'Event unpublished successfully',
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
      });
      if (vars.id) {
        qc.invalidateQueries({
          queryKey: GET_EVENT_DETAIL_KEY({
            id: vars.id,
          }) as unknown as QueryKey,
        });
      }
    },
    ...options,
  });
}
