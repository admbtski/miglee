'use client';

import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  // Queries
  MyPlanDocument,
  type MyPlanQuery,
  MySubscriptionDocument,
  type MySubscriptionQuery,
  MyPlanPeriodsDocument,
  type MyPlanPeriodsQuery,
  type MyPlanPeriodsQueryVariables,
  MyEventSponsorshipsDocument,
  type MyEventSponsorshipsQuery,
  type MyEventSponsorshipsQueryVariables,
  EventSponsorshipDocument,
  type EventSponsorshipQuery,
  type EventSponsorshipQueryVariables,
  // Mutations
  CreateSubscriptionCheckoutDocument,
  type CreateSubscriptionCheckoutMutation,
  type CreateSubscriptionCheckoutMutationVariables,
  CreateOneOffCheckoutDocument,
  type CreateOneOffCheckoutMutation,
  type CreateOneOffCheckoutMutationVariables,
  CreateEventSponsorshipCheckoutDocument,
  type CreateEventSponsorshipCheckoutMutation,
  type CreateEventSponsorshipCheckoutMutationVariables,
  CancelSubscriptionDocument,
  type CancelSubscriptionMutation,
  type CancelSubscriptionMutationVariables,
  ReactivateSubscriptionDocument,
  type ReactivateSubscriptionMutation,
  UseBoostDocument,
  type UseBoostMutation,
  type UseBoostMutationVariables,
  UseLocalPushDocument,
  type UseLocalPushMutation,
  type UseLocalPushMutationVariables,
  UpdateIntentHighlightColorDocument,
  type UpdateIntentHighlightColorMutation,
  type UpdateIntentHighlightColorMutationVariables,
  GetUserPlanReceiptUrlDocument,
  type GetUserPlanReceiptUrlMutation,
  type GetUserPlanReceiptUrlMutationVariables,
  GetEventSponsorshipReceiptUrlDocument,
  type GetEventSponsorshipReceiptUrlMutation,
  type GetEventSponsorshipReceiptUrlMutationVariables,
} from './__generated__/react-query-update';
import { gqlClient } from './client';

// =============================================================================
// Query Keys
// =============================================================================

export const billingKeys = {
  all: ['billing'] as const,
  myPlan: () => [...billingKeys.all, 'myPlan'] as const,
  mySubscription: () => [...billingKeys.all, 'mySubscription'] as const,
  myPlanPeriods: (limit?: number) =>
    [...billingKeys.all, 'myPlanPeriods', limit] as const,
  myEventSponsorships: (limit?: number) =>
    [...billingKeys.all, 'myEventSponsorships', limit] as const,
  eventSponsorship: (intentId: string) =>
    [...billingKeys.all, 'eventSponsorship', intentId] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Get current user's effective plan
 */
export function useMyPlan(
  options?: Omit<
    UseQueryOptions<MyPlanQuery, unknown, MyPlanQuery>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: billingKeys.myPlan(),
    queryFn: async () => gqlClient.request(MyPlanDocument),
    ...options,
  });
}

/**
 * Get current user's active subscription (if any)
 */
export function useMySubscription(
  options?: Omit<
    UseQueryOptions<MySubscriptionQuery, unknown, MySubscriptionQuery>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: billingKeys.mySubscription(),
    queryFn: async () => gqlClient.request(MySubscriptionDocument),
    ...options,
  });
}

/**
 * Get current user's active plan periods
 */
export function useMyPlanPeriods(
  variables?: MyPlanPeriodsQueryVariables,
  options?: Omit<
    UseQueryOptions<MyPlanPeriodsQuery, unknown, MyPlanPeriodsQuery>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: billingKeys.myPlanPeriods(variables?.limit ?? undefined),
    queryFn: async () =>
      gqlClient.request(MyPlanPeriodsDocument, variables ?? {}),
    ...options,
  });
}

/**
 * Get all event sponsorships for the current user
 */
export function useMyEventSponsorships(
  variables?: MyEventSponsorshipsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      MyEventSponsorshipsQuery,
      unknown,
      MyEventSponsorshipsQuery
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: billingKeys.myEventSponsorships(variables?.limit ?? undefined),
    queryFn: async () =>
      gqlClient.request(MyEventSponsorshipsDocument, variables ?? {}),
    ...options,
  });
}

/**
 * Get event sponsorship for an intent
 */
export function useEventSponsorship(
  variables: EventSponsorshipQueryVariables,
  options?: Omit<
    UseQueryOptions<EventSponsorshipQuery, unknown, EventSponsorshipQuery>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: billingKeys.eventSponsorship(variables.intentId),
    queryFn: async () => gqlClient.request(EventSponsorshipDocument, variables),
    ...options,
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create checkout session for user subscription (auto-renewable)
 */
export function useCreateSubscriptionCheckout(
  options?: UseMutationOptions<
    CreateSubscriptionCheckoutMutation,
    unknown,
    CreateSubscriptionCheckoutMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(CreateSubscriptionCheckoutDocument, variables),
    onSuccess: () => {
      // Invalidate billing queries after successful checkout creation
      queryClient.invalidateQueries({ queryKey: billingKeys.myPlan() });
      queryClient.invalidateQueries({ queryKey: billingKeys.mySubscription() });
      queryClient.invalidateQueries({ queryKey: billingKeys.myPlanPeriods() });
    },
    ...options,
  });
}

/**
 * Create checkout session for one-off payment (month or year)
 */
export function useCreateOneOffCheckout(
  options?: UseMutationOptions<
    CreateOneOffCheckoutMutation,
    unknown,
    CreateOneOffCheckoutMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(CreateOneOffCheckoutDocument, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.myPlan() });
      queryClient.invalidateQueries({ queryKey: billingKeys.myPlanPeriods() });
    },
    ...options,
  });
}

/**
 * Create checkout session for event sponsorship
 */
export function useCreateEventSponsorshipCheckout(
  options?: UseMutationOptions<
    CreateEventSponsorshipCheckoutMutation,
    unknown,
    CreateEventSponsorshipCheckoutMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(CreateEventSponsorshipCheckoutDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate event sponsorship query
      if (variables.input.intentId) {
        queryClient.invalidateQueries({
          queryKey: billingKeys.eventSponsorship(variables.input.intentId),
        });
      }
    },
    ...options,
  });
}

/**
 * Cancel user subscription (at period end or immediately)
 */
export function useCancelSubscription(
  options?: UseMutationOptions<
    CancelSubscriptionMutation,
    unknown,
    CancelSubscriptionMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(CancelSubscriptionDocument, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.mySubscription() });
    },
    ...options,
  });
}

/**
 * Reactivate a subscription that was set to cancel at period end
 */
export function useReactivateSubscription(
  options?: UseMutationOptions<ReactivateSubscriptionMutation, unknown, void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => gqlClient.request(ReactivateSubscriptionDocument),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.mySubscription() });
    },
    ...options,
  });
}

/**
 * Use a boost for event sponsorship
 */
export function useBoost(
  options?: UseMutationOptions<
    UseBoostMutation,
    unknown,
    UseBoostMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(UseBoostDocument, variables),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: billingKeys.eventSponsorship(variables.intentId),
      });
    },
    ...options,
  });
}

/**
 * Use a local push notification for event sponsorship
 */
export function useLocalPush(
  options?: UseMutationOptions<
    UseLocalPushMutation,
    unknown,
    UseLocalPushMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(UseLocalPushDocument, variables),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: billingKeys.eventSponsorship(variables.intentId),
      });
    },
    ...options,
  });
}

/**
 * Update intent highlight color
 */
export function useUpdateIntentHighlightColor(
  options?: UseMutationOptions<
    UpdateIntentHighlightColorMutation,
    unknown,
    UpdateIntentHighlightColorMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(UpdateIntentHighlightColorDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate event sponsorship query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: billingKeys.eventSponsorship(variables.intentId),
      });
      // Also invalidate intent detail if needed
      queryClient.invalidateQueries({
        queryKey: ['intent', variables.intentId],
      });
    },
    ...options,
  });
}

/**
 * Get receipt URL for a user plan period
 */
export function useGetUserPlanReceiptUrl(
  options?: UseMutationOptions<
    GetUserPlanReceiptUrlMutation,
    unknown,
    GetUserPlanReceiptUrlMutationVariables
  >
) {
  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(GetUserPlanReceiptUrlDocument, variables),
    ...options,
  });
}

/**
 * Get receipt URL for an event sponsorship period
 */
export function useGetEventSponsorshipReceiptUrl(
  options?: UseMutationOptions<
    GetEventSponsorshipReceiptUrlMutation,
    unknown,
    GetEventSponsorshipReceiptUrlMutationVariables
  >
) {
  return useMutation({
    mutationFn: async (variables) =>
      gqlClient.request(GetEventSponsorshipReceiptUrlDocument, variables),
    ...options,
  });
}
