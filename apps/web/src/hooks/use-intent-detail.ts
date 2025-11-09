import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '@/lib/api/client';

/**
 * Dedykowane query dla detalu wydarzenia
 * Zawiera wszystkie potrzebne pola włącznie z sponsorship i inviteLinks
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
        imageUrl
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
        imageUrl
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
        imageUrl
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
        imageUrl
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
          imageUrl
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
          imageUrl
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
          imageUrl
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

export function useIntentDetail(intentId: string) {
  return useQuery({
    queryKey: ['intent-detail', intentId],
    queryFn: async () => {
      const response = await gqlClient.request<any>(GetIntentDetailDocument, {
        id: intentId,
      });
      return response;
    },
    enabled: !!intentId,
  });
}
