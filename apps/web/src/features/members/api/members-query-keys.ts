/**
 * Query keys for members-related queries.
 * Centralizes cache key management for React Query.
 */

export const membersQueryKeys = {
  // Base keys
  all: ['members'] as const,
  eventMembers: (eventId: string) => ['event-members', eventId] as const,

  // Single member queries
  member: (eventId: string, userId: string) =>
    ['event-member', eventId, userId] as const,
  myMembership: (eventId: string) =>
    ['my-membership-for-event', eventId] as const,

  // Lists
  myMemberships: (filters?: { status?: string; role?: string }) =>
    ['my-memberships', filters] as const,
  myEvents: (filters?: {
    role?: string;
    membershipStatus?: string;
    eventStatuses?: string[];
  }) => ['my-events', filters] as const,

  // Statistics
  memberStats: (eventId: string) => ['event-member-stats', eventId] as const,

  // Invalidation helpers
  invalidateForEvent: (eventId: string) => ({
    eventMembers: ['event-members', eventId],
    memberStats: ['event-member-stats', eventId],
  }),
} as const;

