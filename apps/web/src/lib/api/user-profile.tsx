'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { gqlClient } from './client';
import {
  GetUserProfileDocument,
  GetMyFullProfileDocument,
  UpdateUserProfileDocument,
  UpdateUserPrivacyDocument,
  UpsertUserDisciplineDocument,
  RemoveUserDisciplineDocument,
  UpsertUserAvailabilityDocument,
  RemoveUserAvailabilityDocument,
  AddUserSocialLinkDocument,
  RemoveUserSocialLinkDocument,
  type GetUserProfileQuery,
  type GetUserProfileQueryVariables,
  type GetMyFullProfileQuery,
  type GetMyFullProfileQueryVariables,
  type UpdateUserProfileMutation,
  type UpdateUserProfileMutationVariables,
  type UpdateUserPrivacyMutation,
  type UpdateUserPrivacyMutationVariables,
  type UpsertUserDisciplineMutation,
  type UpsertUserDisciplineMutationVariables,
  type RemoveUserDisciplineMutation,
  type RemoveUserDisciplineMutationVariables,
  type UpsertUserAvailabilityMutation,
  type UpsertUserAvailabilityMutationVariables,
  type RemoveUserAvailabilityMutation,
  type RemoveUserAvailabilityMutationVariables,
  type AddUserSocialLinkMutation,
  type AddUserSocialLinkMutationVariables,
  type RemoveUserSocialLinkMutation,
  type RemoveUserSocialLinkMutationVariables,
} from './__generated__/react-query-update';

// =============================================================================
// Query Keys
// =============================================================================

export const USER_PROFILE_KEY = (variables: GetUserProfileQueryVariables) =>
  ['UserProfile', variables] as const;

export const MY_FULL_PROFILE_KEY = (
  variables: GetMyFullProfileQueryVariables
) => ['MyFullProfile', variables] as const;

// =============================================================================
// Queries
// =============================================================================

export function buildUserProfileOptions(
  variables: GetUserProfileQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetUserProfileQuery,
      unknown,
      GetUserProfileQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetUserProfileQuery,
  unknown,
  GetUserProfileQuery,
  QueryKey
> {
  return {
    queryKey: USER_PROFILE_KEY(variables) as unknown as QueryKey,
    queryFn: () =>
      gqlClient.request<GetUserProfileQuery, GetUserProfileQueryVariables>(
        GetUserProfileDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function useUserProfileQuery(
  variables: GetUserProfileQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetUserProfileQuery,
      unknown,
      GetUserProfileQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildUserProfileOptions(variables, {
      enabled: !!(variables.id || variables.name),
      ...(options ?? {}),
    })
  );
}

export function buildMyFullProfileOptions(
  variables: GetMyFullProfileQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetMyFullProfileQuery,
      unknown,
      GetMyFullProfileQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetMyFullProfileQuery,
  unknown,
  GetMyFullProfileQuery,
  QueryKey
> {
  return {
    queryKey: MY_FULL_PROFILE_KEY(variables) as unknown as QueryKey,
    queryFn: () =>
      gqlClient.request<GetMyFullProfileQuery, GetMyFullProfileQueryVariables>(
        GetMyFullProfileDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function useMyFullProfileQuery(
  variables: GetMyFullProfileQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetMyFullProfileQuery,
      unknown,
      GetMyFullProfileQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildMyFullProfileOptions(variables, {
      enabled: !!variables.id,
      ...(options ?? {}),
    })
  );
}

// =============================================================================
// Mutations
// =============================================================================

export function useUpdateUserProfile(
  options?: UseMutationOptions<
    UpdateUserProfileMutation,
    unknown,
    UpdateUserProfileMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['UpdateUserProfile'],
    mutationFn: (variables: UpdateUserProfileMutationVariables) =>
      gqlClient.request<
        UpdateUserProfileMutation,
        UpdateUserProfileMutationVariables
      >(UpdateUserProfileDocument, variables),
    onSuccess: (data, variables, context) => {
      // Invalidate all user profile queries
      void queryClient.invalidateQueries({
        queryKey: ['UserProfile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['MyFullProfile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['Me'],
      });

      options?.onSuccess?.(data, variables, context);
    },
    meta: {
      successMessage: 'Profile updated successfully',
    },
    ...options,
  });
}

export function useUpdateUserPrivacy(
  options?: UseMutationOptions<
    UpdateUserPrivacyMutation,
    unknown,
    UpdateUserPrivacyMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['UpdateUserPrivacy'],
    mutationFn: (variables: UpdateUserPrivacyMutationVariables) =>
      gqlClient.request<
        UpdateUserPrivacyMutation,
        UpdateUserPrivacyMutationVariables
      >(UpdateUserPrivacyDocument, variables),
    onSuccess: (data, variables, context) => {
      void queryClient.invalidateQueries({
        queryKey: ['UserProfile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['MyFullProfile'],
      });

      options?.onSuccess?.(data, variables, context);
    },
    meta: {
      successMessage: 'Privacy settings updated',
    },
    ...options,
  });
}

export function useUpsertUserDiscipline(
  options?: UseMutationOptions<
    UpsertUserDisciplineMutation,
    unknown,
    UpsertUserDisciplineMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['UpsertUserDiscipline'],
    mutationFn: (variables: UpsertUserDisciplineMutationVariables) =>
      gqlClient.request<
        UpsertUserDisciplineMutation,
        UpsertUserDisciplineMutationVariables
      >(UpsertUserDisciplineDocument, variables),
    onSuccess: (data, variables, context) => {
      void queryClient.invalidateQueries({
        queryKey: ['UserProfile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['MyFullProfile'],
      });

      options?.onSuccess?.(data, variables, context);
    },
    meta: {
      successMessage: (variables) =>
        variables.input.id ? 'Discipline updated' : 'Discipline added',
    },
    ...options,
  });
}

export function useRemoveUserDiscipline(
  options?: UseMutationOptions<
    RemoveUserDisciplineMutation,
    unknown,
    RemoveUserDisciplineMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['RemoveUserDiscipline'],
    mutationFn: (variables: RemoveUserDisciplineMutationVariables) =>
      gqlClient.request<
        RemoveUserDisciplineMutation,
        RemoveUserDisciplineMutationVariables
      >(RemoveUserDisciplineDocument, variables),
    onSuccess: (data, variables, context) => {
      void queryClient.invalidateQueries({
        queryKey: ['UserProfile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['MyFullProfile'],
      });

      options?.onSuccess?.(data, variables, context);
    },
    meta: {
      successMessage: 'Discipline removed',
    },
    ...options,
  });
}

export function useUpsertUserAvailability(
  options?: UseMutationOptions<
    UpsertUserAvailabilityMutation,
    unknown,
    UpsertUserAvailabilityMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['UpsertUserAvailability'],
    mutationFn: (variables: UpsertUserAvailabilityMutationVariables) =>
      gqlClient.request<
        UpsertUserAvailabilityMutation,
        UpsertUserAvailabilityMutationVariables
      >(UpsertUserAvailabilityDocument, variables),
    onSuccess: (data, variables, context) => {
      void queryClient.invalidateQueries({
        queryKey: ['UserProfile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['MyFullProfile'],
      });

      options?.onSuccess?.(data, variables, context);
    },
    meta: {
      successMessage: (variables) =>
        variables.input.id ? 'Availability updated' : 'Availability added',
    },
    ...options,
  });
}

export function useRemoveUserAvailability(
  options?: UseMutationOptions<
    RemoveUserAvailabilityMutation,
    unknown,
    RemoveUserAvailabilityMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['RemoveUserAvailability'],
    mutationFn: (variables: RemoveUserAvailabilityMutationVariables) =>
      gqlClient.request<
        RemoveUserAvailabilityMutation,
        RemoveUserAvailabilityMutationVariables
      >(RemoveUserAvailabilityDocument, variables),
    onSuccess: (data, variables, context) => {
      void queryClient.invalidateQueries({
        queryKey: ['UserProfile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['MyFullProfile'],
      });

      options?.onSuccess?.(data, variables, context);
    },
    meta: {
      successMessage: 'Availability removed',
    },
    ...options,
  });
}

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
    onSuccess: (data, variables, context) => {
      void queryClient.invalidateQueries({
        queryKey: ['UserProfile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['MyFullProfile'],
      });

      options?.onSuccess?.(data, variables, context);
    },
    meta: {
      successMessage: 'Social link added',
    },
    ...options,
  });
}

export function useRemoveUserSocialLink(
  options?: UseMutationOptions<
    RemoveUserSocialLinkMutation,
    unknown,
    RemoveUserSocialLinkMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['RemoveUserSocialLink'],
    mutationFn: (variables: RemoveUserSocialLinkMutationVariables) =>
      gqlClient.request<
        RemoveUserSocialLinkMutation,
        RemoveUserSocialLinkMutationVariables
      >(RemoveUserSocialLinkDocument, variables),
    onSuccess: (data, variables, context) => {
      void queryClient.invalidateQueries({
        queryKey: ['UserProfile'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['MyFullProfile'],
      });

      options?.onSuccess?.(data, variables, context);
    },
    meta: {
      successMessage: 'Social link removed',
    },
    ...options,
  });
}
