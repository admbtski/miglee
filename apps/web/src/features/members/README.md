# Members Feature

## Overview

The **Members** feature manages the lifecycle of event membership (User↔Event relationship). It handles all aspects of participation including:

- **Joining & Leaving**: Requesting to join, canceling requests, leaving events
- **Invitations**: Accepting invites, managing waitlist
- **Moderation**: Approving, rejecting, kicking, banning members
- **Role Management**: Promoting/demoting between PARTICIPANT, MODERATOR, OWNER

This feature is **separate from Events** which handles event definition and lifecycle (creation, updates, publishing, cancellation).

## Architecture

```
@/features/members/
├── api/                    # React Query hooks for GraphQL operations
├── components/             # UI components for membership display/actions
├── types/                  # TypeScript type definitions
└── utils/                  # Helper functions (formatters, etc.)
```

## API Hooks

### Query Hooks

| Hook | Description |
|------|-------------|
| `useEventMembersQuery` | Fetch list of members for an event |
| `useEventMemberQuery` | Fetch single member details |
| `useEventMemberStatsQuery` | Fetch membership statistics (counts by status) |
| `useMyMembershipForEventQuery` | Get current user's membership for an event |
| `useMyMembershipsQuery` | Get all memberships for current user |
| `useMyEventsQuery` | Get events where user is a member |

### User Action Mutations

| Hook | Description |
|------|-------------|
| `useRequestJoinEventMutation` | Request to join an event |
| `useCancelJoinRequestMutation` | Cancel pending join request |
| `useAcceptInviteMutation` | Accept an invitation |
| `useLeaveEventMutation` | Leave an event |

### Waitlist Mutations

| Hook | Description |
|------|-------------|
| `useJoinWaitlistOpenMutation` | Join event waitlist |
| `useLeaveWaitlistMutation` | Leave waitlist |
| `usePromoteFromWaitlistMutation` | Promote member from waitlist (mod/owner) |

### Moderator/Owner Mutations

| Hook | Description |
|------|-------------|
| `useInviteMemberMutation` | Invite a user to event |
| `useApproveMembershipMutation` | Approve pending membership |
| `useRejectMembershipMutation` | Reject membership request |
| `useKickMemberMutation` | Remove member from event |
| `useBanMemberMutation` | Ban member from event |
| `useUnbanMemberMutation` | Unban previously banned member |
| `useUpdateMemberRoleMutation` | Change member role |
| `useCancelPendingOrInviteForUserMutation` | Cancel pending invite |

## Components

| Component | Description |
|-----------|-------------|
| `EventParticipants` | Displays list of event participants grouped by role |
| `EventJoinSection` | Membership actions UI (join, leave, waitlist, etc.) |
| `CapacityStatusCard` | Visual indicator of event capacity status |

## Usage

```typescript
// Import from members feature
import {
  useEventMembersQuery,
  useLeaveEventMutation,
  EventParticipants,
} from '@/features/members';

// Use in component
function MyComponent({ eventId }) {
  const { data: members } = useEventMembersQuery({ eventId });
  const leaveMutation = useLeaveEventMutation();
  
  const handleLeave = () => {
    leaveMutation.mutate({ eventId });
  };
  
  return (
    <div>
      <EventParticipants event={event} />
      <button onClick={handleLeave}>Leave Event</button>
    </div>
  );
}
```

## Cache Invalidation

The feature provides helper functions for cache management:

```typescript
import {
  invalidateMembers,        // Invalidate member queries for an event
  invalidateMyMemberships,  // Invalidate current user's memberships
  invalidateMembershipChange, // Comprehensive invalidation
} from '@/features/members';
```

## Query Keys

All query keys are centralized for consistent cache management:

```typescript
import {
  GET_EVENT_MEMBERS_KEY,
  GET_MY_MEMBERSHIP_FOR_EVENT_KEY,
  GET_MY_MEMBERSHIPS_KEY,
  membersQueryKeys,
} from '@/features/members';
```

## Related Features

- **Events** (`@/features/events`): Event lifecycle (create, update, publish)
- **Join Form** (`@/features/join-form`): Join questions and answers
- **Check-in** (`@/features/checkin`): Event check-in management

## Migration Notes

This feature was extracted from the `events` feature. For backwards compatibility, all exports are also re-exported from `@/features/events`. However, new code should import directly from `@/features/members`.

```typescript
// ✅ Preferred - import from members
import { useEventMembersQuery } from '@/features/members';

// ⚠️ Deprecated - still works via re-export
import { useEventMembersQuery } from '@/features/events';
```

