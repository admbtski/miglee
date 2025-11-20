/**
 * Custom hook for fetching complete intent (event) details
 *
 * @description
 * Provides comprehensive intent data including:
 * - Basic info (title, description, dates, location)
 * - Join settings (mode, capacity, windows, manual locks)
 * - Visibility and privacy settings
 * - Members and owner information
 * - Categories and tags
 * - Sponsorship details (if applicable)
 * - Invite links (for owner/moderators)
 * - Computed helpers (status, canJoin, isFull, etc.)
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useIntentDetail('intent-123');
 *
 * if (isLoading) return <LoadingSkeleton />;
 * if (error) return <ErrorState />;
 *
 * const intent = data?.intent;
 * console.log(intent.title, intent.status, intent.canJoin);
 * ```
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '@/lib/api/client';
import {
  GetIntentDetailQuery,
  GetIntentQueryVariables,
} from '@/lib/api/__generated__/react-query-update';

// =============================================================================
// GraphQL Document
// =============================================================================

/**
 * Complete intent detail query with all fields
 * Includes sponsorship and inviteLinks
 */
const GetIntentDetailDocument = `
  query GetIntentDetail($id: ID!) {
    intent(id: $id) {
      id
      title
      description
      notes
      
      visibility
      joinMode
      mode
      min
      max
      
      startAt
      endAt
      
      # Media
      coverKey
      coverBlurhash
      
      # Join windows / cutoffs / manual lock
      allowJoinLate
      joinOpensMinutesBeforeStart
      joinCutoffMinutesBeforeStart
      lateJoinCutoffMinutesAfterStart
      joinManuallyClosed
      joinManuallyClosedAt
      joinManuallyClosedBy {
        id
        name
        avatarKey
        avatarBlurhash
      }
      joinManualCloseReason
      
      meetingKind
      onlineUrl
      
      lat
      lng
      address
      placeId
      radiusKm
      
      levels
      
      addressVisibility
      membersVisibility
      
      # Computed helpers
      status
      joinedCount
      commentsCount
      messagesCount
      isFull
      hasStarted
      hasEnded
      canJoin
      joinOpen
      lockReason
      isOngoing
      withinLock
      isOnsite
      isOnline
      isHybrid
      
      # Ownership
      ownerId
      
      # Cancellation
      canceledAt
      canceledBy {
        id
        email
        name
        avatarKey
        avatarBlurhash
        role
        verifiedAt
        createdAt
        updatedAt
        lastSeenAt
        locale
        tz
        acceptedTermsAt
        acceptedMarketingAt
      }
      cancelReason
      isCanceled
      
      # Soft-delete
      deletedAt
      deletedBy {
        id
        email
        name
        avatarKey
        avatarBlurhash
        role
        verifiedAt
        createdAt
        updatedAt
        lastSeenAt
        locale
        tz
        acceptedTermsAt
        acceptedMarketingAt
      }
      deleteReason
      isDeleted
      
      createdAt
      updatedAt
      
      categories {
        id
        slug
        names
        createdAt
        updatedAt
      }
      
      tags {
        id
        label
        slug
        createdAt
        updatedAt
      }
      
      # Convenience relations
      owner {
        id
        email
        name
        avatarKey
        avatarBlurhash
        role
        verifiedAt
        createdAt
        updatedAt
        lastSeenAt
        locale
        tz
        acceptedTermsAt
        acceptedMarketingAt
      }
      
      members {
        id
        intentId
        userId
        role
        status
        joinedAt
        leftAt
        note
        user {
          id
          email
          name
          avatarKey
          avatarBlurhash
          role
          verifiedAt
          createdAt
          updatedAt
          lastSeenAt
          locale
          tz
          acceptedTermsAt
          acceptedMarketingAt
        }
        addedBy {
          id
          name
          avatarKey
          avatarBlurhash
        }
      }
      
      # Sponsorship (może być null)
      sponsorship {
        id
        intentId
        sponsorId
        plan
        status
        highlightOn
        startedAt
        endsAt
        boostsUsed
        localPushes
        createdAt
        updatedAt
        sponsor {
          id
          email
          name
          avatarKey
          avatarBlurhash
          role
          verifiedAt
          createdAt
          updatedAt
          lastSeenAt
          locale
          tz
          acceptedTermsAt
          acceptedMarketingAt
        }
      }
      
      # Invite Links (tylko dla owner/mod)
      inviteLinks {
        id
        intentId
        code
        maxUses
        usedCount
        expiresAt
        createdAt
        isExpired
        isMaxedOut
        isValid
      }
    }
  }
`;

// =============================================================================
// Hook
// =============================================================================

/**
 * Fetch complete intent details by ID
 *
 * @param intentId - Intent ID to fetch
 * @returns React Query result with intent data
 */
export function useIntentDetail(intentId: string) {
  return useQuery({
    queryKey: ['intent-detail', intentId],
    queryFn: async () => {
      const response = await gqlClient.request<
        GetIntentDetailQuery,
        GetIntentQueryVariables
      >(GetIntentDetailDocument, {
        id: intentId,
      });
      return response;
    },
    enabled: !!intentId,
  });
}
