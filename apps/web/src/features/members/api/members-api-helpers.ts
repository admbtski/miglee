/**
 * Helper functions for members API operations.
 * Centralized cache invalidation logic.
 */

import { getQueryClient } from '@/lib/config/query-client';

/**
 * Invalidate all member-related queries for a specific event.
 * Call this after mutations that change membership state.
 */
export function invalidateMembers(eventId: string) {
  const qc = getQueryClient();

  // Invalidate event members list
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'GetEventMembers' &&
      (q.queryKey[1] as Record<string, unknown>)?.eventId === eventId,
  });

  // Invalidate member stats
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'GetEventMemberStats' &&
      (q.queryKey[1] as Record<string, unknown>)?.eventId === eventId,
  });

  // Invalidate event detail (for member counts, etc.)
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'GetEventDetail' &&
      (q.queryKey[1] as Record<string, unknown>)?.id === eventId,
  });

  // Invalidate my membership for this event
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'GetMyMembershipForEvent' &&
      (q.queryKey[1] as Record<string, unknown>)?.eventId === eventId,
  });
}

/**
 * Invalidate all membership-related queries for the current user.
 * Call this after user joins/leaves/requests events.
 */
export function invalidateMyMemberships() {
  const qc = getQueryClient();

  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === 'GetMyMemberships',
  });

  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === 'GetMyEvents',
  });
}

/**
 * Invalidate event listing queries.
 * Call this after membership changes that affect event counts.
 */
export function invalidateEventListings() {
  const qc = getQueryClient();

  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
  });

  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEventsListingInfinite',
  });
}

/**
 * Comprehensive invalidation for membership changes.
 * Combines all relevant invalidations.
 */
export function invalidateMembershipChange(eventId: string) {
  invalidateMembers(eventId);
  invalidateMyMemberships();
  invalidateEventListings();
}

