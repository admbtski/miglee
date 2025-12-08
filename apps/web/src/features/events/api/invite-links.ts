/**
 * React Query hooks for Event Invite Links
 */

import {
  EventInviteLinksDocument,
  EventInviteLinksQuery,
  EventInviteLinksQueryVariables,
  EventInviteLinkDocument,
  EventInviteLinkQuery,
  EventInviteLinkQueryVariables,
  ValidateInviteLinkDocument,
  ValidateInviteLinkQuery,
  ValidateInviteLinkQueryVariables,
  CreateEventInviteLinkDocument,
  CreateEventInviteLinkMutation,
  CreateEventInviteLinkMutationVariables,
  UpdateEventInviteLinkDocument,
  UpdateEventInviteLinkMutation,
  UpdateEventInviteLinkMutationVariables,
  RevokeEventInviteLinkDocument,
  RevokeEventInviteLinkMutation,
  RevokeEventInviteLinkMutationVariables,
  DeleteEventInviteLinkDocument,
  DeleteEventInviteLinkMutation,
  DeleteEventInviteLinkMutationVariables,
  JoinByInviteLinkDocument,
  JoinByInviteLinkMutation,
  JoinByInviteLinkMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

/* --------------------------------- KEYS ---------------------------------- */
export const GET_INVITE_LINKS_LIST_KEY = (
  variables: EventInviteLinksQueryVariables
) => ['GetEventInviteLinks', variables] as const;

export const GET_INVITE_LINK_ONE_KEY = (
  variables: EventInviteLinkQueryVariables
) => ['GetEventInviteLink', variables] as const;

export const VALIDATE_INVITE_LINK_KEY = (
  variables: ValidateInviteLinkQueryVariables
) => ['ValidateInviteLink', variables] as const;

/* ----------------------------- QUERY BUILDERS ---------------------------- */
export function buildGetEventInviteLinksOptions(
  variables: EventInviteLinksQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventInviteLinksQuery,
      Error,
      EventInviteLinksQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  EventInviteLinksQuery,
  Error,
  EventInviteLinksQuery,
  QueryKey
> {
  return {
    queryKey: GET_INVITE_LINKS_LIST_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<EventInviteLinksQuery, EventInviteLinksQueryVariables>(
        EventInviteLinksDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function buildGetEventInviteLinkOptions(
  variables: EventInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventInviteLinkQuery,
      Error,
      EventInviteLinkQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  EventInviteLinkQuery,
  Error,
  EventInviteLinkQuery,
  QueryKey
> {
  return {
    queryKey: GET_INVITE_LINK_ONE_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<EventInviteLinkQuery, EventInviteLinkQueryVariables>(
        EventInviteLinkDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function buildValidateInviteLinkOptions(
  variables: ValidateInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<
      ValidateInviteLinkQuery,
      Error,
      ValidateInviteLinkQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  ValidateInviteLinkQuery,
  Error,
  ValidateInviteLinkQuery,
  QueryKey
> {
  return {
    queryKey: VALIDATE_INVITE_LINK_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        ValidateInviteLinkQuery,
        ValidateInviteLinkQueryVariables
      >(ValidateInviteLinkDocument, variables),
    ...(options ?? {}),
  };
}

/* --------------------------------- QUERIES -------------------------------- */
export function useEventInviteLinksQuery(
  variables: EventInviteLinksQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventInviteLinksQuery,
      Error,
      EventInviteLinksQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventInviteLinksOptions(variables, options));
}

export function useEventInviteLinkQuery(
  variables: EventInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventInviteLinkQuery,
      Error,
      EventInviteLinkQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventInviteLinkOptions(variables, options));
}

export function useValidateInviteLinkQuery(
  variables: ValidateInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<
      ValidateInviteLinkQuery,
      Error,
      ValidateInviteLinkQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildValidateInviteLinkOptions(variables, options));
}

/* --------------------------- MUTATION BUILDERS --------------------------- */
export function buildCreateEventInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    CreateEventInviteLinkMutation,
    unknown,
    CreateEventInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  CreateEventInviteLinkMutation,
  unknown,
  CreateEventInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['CreateEventInviteLink'] as QueryKey,
    mutationFn: async (variables: CreateEventInviteLinkMutationVariables) =>
      gqlClient.request<
        CreateEventInviteLinkMutation,
        CreateEventInviteLinkMutationVariables
      >(CreateEventInviteLinkDocument, variables),
    meta: {
      successMessage: 'Link zaproszeniowy utworzony pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function buildUpdateEventInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    UpdateEventInviteLinkMutation,
    unknown,
    UpdateEventInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  UpdateEventInviteLinkMutation,
  unknown,
  UpdateEventInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['UpdateEventInviteLink'] as QueryKey,
    mutationFn: async (variables: UpdateEventInviteLinkMutationVariables) =>
      gqlClient.request<
        UpdateEventInviteLinkMutation,
        UpdateEventInviteLinkMutationVariables
      >(UpdateEventInviteLinkDocument, variables),
    meta: {
      successMessage: 'Link zaproszeniowy zaktualizowany pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function buildRevokeEventInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    RevokeEventInviteLinkMutation,
    unknown,
    RevokeEventInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  RevokeEventInviteLinkMutation,
  unknown,
  RevokeEventInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['RevokeEventInviteLink'] as QueryKey,
    mutationFn: async (variables: RevokeEventInviteLinkMutationVariables) =>
      gqlClient.request<
        RevokeEventInviteLinkMutation,
        RevokeEventInviteLinkMutationVariables
      >(RevokeEventInviteLinkDocument, variables),
    meta: {
      successMessage: 'Link zaproszeniowy odwołany pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function buildDeleteEventInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    DeleteEventInviteLinkMutation,
    unknown,
    DeleteEventInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  DeleteEventInviteLinkMutation,
  unknown,
  DeleteEventInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['DeleteEventInviteLink'] as QueryKey,
    mutationFn: async (variables: DeleteEventInviteLinkMutationVariables) =>
      gqlClient.request<
        DeleteEventInviteLinkMutation,
        DeleteEventInviteLinkMutationVariables
      >(DeleteEventInviteLinkDocument, variables),
    meta: {
      successMessage: 'Link zaproszeniowy usunięty pomyślnie',
    },
    ...(options ?? {}),
  };
}

export function buildJoinByInviteLinkOptions<TContext = unknown>(
  options?: UseMutationOptions<
    JoinByInviteLinkMutation,
    unknown,
    JoinByInviteLinkMutationVariables,
    TContext
  >
): UseMutationOptions<
  JoinByInviteLinkMutation,
  unknown,
  JoinByInviteLinkMutationVariables,
  TContext
> {
  return {
    mutationKey: ['JoinByInviteLink'] as QueryKey,
    mutationFn: async (variables: JoinByInviteLinkMutationVariables) =>
      gqlClient.request<
        JoinByInviteLinkMutation,
        JoinByInviteLinkMutationVariables
      >(JoinByInviteLinkDocument, variables),
    meta: {
      successMessage: 'Dołączono do wydarzenia pomyślnie',
    },
    ...(options ?? {}),
  };
}

/* -------------------------------- MUTATIONS ------------------------------- */
export function useCreateEventInviteLinkMutation(
  options?: UseMutationOptions<
    CreateEventInviteLinkMutation,
    unknown,
    CreateEventInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CreateEventInviteLinkMutation,
    unknown,
    CreateEventInviteLinkMutationVariables
  >(
    buildCreateEventInviteLinkOptions({
      onSuccess: (data, _vars) => {
        // Invalidate the list query for this event
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetEventInviteLinks' &&
            (q.queryKey[1] as any)?.eventId ===
              data.createEventInviteLink.eventId,
        });
      },
      ...(options ?? {}),
    })
  );
}

export function useUpdateEventInviteLinkMutation(
  options?: UseMutationOptions<
    UpdateEventInviteLinkMutation,
    unknown,
    UpdateEventInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UpdateEventInviteLinkMutation,
    unknown,
    UpdateEventInviteLinkMutationVariables
  >(
    buildUpdateEventInviteLinkOptions({
      onSuccess: (data, vars) => {
        // Invalidate list queries for this event
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetEventInviteLinks' &&
            (q.queryKey[1] as any)?.eventId ===
              data.updateEventInviteLink.eventId,
        });
        // Invalidate detail query
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_INVITE_LINK_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useRevokeEventInviteLinkMutation(
  options?: UseMutationOptions<
    RevokeEventInviteLinkMutation,
    unknown,
    RevokeEventInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    RevokeEventInviteLinkMutation,
    unknown,
    RevokeEventInviteLinkMutationVariables
  >(
    buildRevokeEventInviteLinkOptions({
      onSuccess: (data, vars) => {
        // Invalidate all list queries (to show/hide revoked links)
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetEventInviteLinks' &&
            (q.queryKey[1] as any)?.eventId ===
              data.revokeEventInviteLink.eventId,
        });
        // Invalidate detail query
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_INVITE_LINK_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useDeleteEventInviteLinkMutation(
  options?: UseMutationOptions<
    DeleteEventInviteLinkMutation,
    unknown,
    DeleteEventInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    DeleteEventInviteLinkMutation,
    unknown,
    DeleteEventInviteLinkMutationVariables
  >(
    buildDeleteEventInviteLinkOptions({
      onSuccess: (_data, vars) => {
        // Invalidate all list queries
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === 'GetEventInviteLinks',
        });
        // Invalidate detail query
        if (vars.id) {
          qc.invalidateQueries({
            queryKey: GET_INVITE_LINK_ONE_KEY({
              id: vars.id,
            }) as unknown as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}

export function useJoinByInviteLinkMutation(
  options?: UseMutationOptions<
    JoinByInviteLinkMutation,
    unknown,
    JoinByInviteLinkMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    JoinByInviteLinkMutation,
    unknown,
    JoinByInviteLinkMutationVariables
  >(
    buildJoinByInviteLinkOptions({
      onSuccess: (data, _vars) => {
        // Invalidate event queries
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            (q.queryKey[0] === 'GetEvent' || q.queryKey[0] === 'GetEvents'),
        });
        // Invalidate memberships
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'myMemberships',
        });
        // Invalidate specific event
        if (data.joinByInviteLink.id) {
          qc.invalidateQueries({
            queryKey: [
              'GetEvent',
              { id: data.joinByInviteLink.id },
            ] as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
