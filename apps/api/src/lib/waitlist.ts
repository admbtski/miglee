/**
 * Waitlist Management Utilities
 *
 * This module provides core functionality for managing event waitlists:
 * - Join window validation (canStillJoin)
 * - Auto-promotion from waitlist to joined (promoteFromWaitlist)
 * - Race condition protection via optimistic locking
 */

// Prisma type import (used for transaction types)
import {
  EventMemberStatus,
  MemberEvent,
  NotificationKind,
} from '../../prisma-client/enums';
import type { PrismaClient } from '../../prisma-client/client';

type Tx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Event data required for join window evaluation
 */
export interface JoinWindowEvent {
  startAt: Date;
  endAt: Date;
  allowJoinLate: boolean;
  joinOpensMinutesBeforeStart: number | null;
  joinCutoffMinutesBeforeStart: number | null;
  lateJoinCutoffMinutesAfterStart: number | null;
  joinManuallyClosed: boolean;
  canceledAt: Date | null;
  deletedAt: Date | null;
}

/**
 * Result of join window evaluation
 */
export type JoinWindowResult =
  | { open: true; reason: null }
  | {
      open: false;
      reason:
        | 'MANUALLY_CLOSED'
        | 'NOT_OPEN_YET'
        | 'PRE_START_CUTOFF'
        | 'LATE_JOIN_DISABLED'
        | 'LATE_JOIN_CUTOFF'
        | 'ENDED'
        | 'CANCELED'
        | 'DELETED';
    };

/**
 * Evaluates whether users can still join an event based on time windows and settings.
 *
 * This is the single source of truth for join window logic.
 * Used by: joinMember, joinWaitlist, approveMembership, promoteFromWaitlist
 *
 * @param event - Event with timing and join settings
 * @param now - Current time (defaults to new Date())
 * @returns Object indicating if join window is open and reason if closed
 */
export function canStillJoin(
  event: JoinWindowEvent,
  now: Date = new Date()
): JoinWindowResult {
  // Event canceled or deleted
  if (event.canceledAt) {
    return { open: false, reason: 'CANCELED' };
  }
  if (event.deletedAt) {
    return { open: false, reason: 'DELETED' };
  }

  // Manually closed by host/mod
  if (event.joinManuallyClosed) {
    return { open: false, reason: 'MANUALLY_CLOSED' };
  }

  const start = new Date(event.startAt);
  const end = new Date(event.endAt);

  // Pre-open window (optional)
  if (
    event.joinOpensMinutesBeforeStart != null &&
    now < new Date(start.getTime() - event.joinOpensMinutesBeforeStart * 60_000)
  ) {
    return { open: false, reason: 'NOT_OPEN_YET' };
  }

  // Cutoff before start (optional)
  if (
    event.joinCutoffMinutesBeforeStart != null &&
    now >=
      new Date(start.getTime() - event.joinCutoffMinutesBeforeStart * 60_000) &&
    now < start
  ) {
    return { open: false, reason: 'PRE_START_CUTOFF' };
  }

  // After start
  if (now >= start) {
    if (!event.allowJoinLate) {
      return { open: false, reason: 'LATE_JOIN_DISABLED' };
    }
    if (
      event.lateJoinCutoffMinutesAfterStart != null &&
      now >=
        new Date(
          start.getTime() + event.lateJoinCutoffMinutesAfterStart * 60_000
        ) &&
      now < end
    ) {
      return { open: false, reason: 'LATE_JOIN_CUTOFF' };
    }
    if (now >= end) {
      return { open: false, reason: 'ENDED' };
    }
  }

  return { open: true, reason: null };
}

/**
 * Promotes the next user from waitlist to joined status.
 *
 * Features:
 * - FIFO ordering (createdAt, then id as tie-breaker)
 * - Race condition protection via optimistic locking
 * - Respects join window and capacity limits
 * - Creates audit events and notifications
 *
 * Safe to call multiple times - idempotent if no eligible candidates.
 *
 * @param tx - Prisma transaction client
 * @param eventId - ID of the event
 * @returns true if someone was promoted, false otherwise
 */
export async function promoteFromWaitlist(
  tx: Tx,
  eventId: string
): Promise<boolean> {
  // 1. Load event with current state
  const event = await tx.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      max: true,
      joinedCount: true,
      startAt: true,
      endAt: true,
      allowJoinLate: true,
      joinOpensMinutesBeforeStart: true,
      joinCutoffMinutesBeforeStart: true,
      lateJoinCutoffMinutesAfterStart: true,
      joinManuallyClosed: true,
      canceledAt: true,
      deletedAt: true,
    },
  });

  if (!event) {
    return false;
  }

  // 2. Check join window
  const joinWindow = canStillJoin(event);
  if (!joinWindow.open) {
    return false;
  }

  // 3. Check capacity (if max is null, event has unlimited capacity)
  if (event.max !== null && event.joinedCount >= event.max) {
    return false;
  }

  // 4. Find next candidate (FIFO)
  const candidate = await tx.eventMember.findFirst({
    where: {
      eventId,
      status: EventMemberStatus.WAITLIST,
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      userId: true,
      createdAt: true,
    },
  });

  if (!candidate) {
    return false;
  }

  // 5. Try to reserve slot with optimistic locking
  // This prevents race conditions when multiple operations try to promote simultaneously
  const updated = await tx.event.updateMany({
    where: {
      id: eventId,
      ...(event.max !== null && { joinedCount: { lt: event.max } }), // Only update if still under capacity
    },
    data: { joinedCount: { increment: 1 } },
  });

  if (updated.count === 0) {
    // Someone else took the last slot - abort
    return false;
  }

  // 6. Promote user
  await tx.eventMember.update({
    where: { id: candidate.id },
    data: {
      status: EventMemberStatus.JOINED,
      joinedAt: new Date(),
    },
  });

  // 7. Create audit event
  await tx.eventMemberEvent.create({
    data: {
      eventId,
      userId: candidate.userId,
      actorId: null, // System action
      kind: MemberEvent.WAITLIST_PROMOTE,
      note: 'Automatically promoted from waitlist',
    },
  });

  // 8. Notify user
  await tx.notification.create({
    data: {
      recipientId: candidate.userId,
      kind: NotificationKind.WAITLIST_PROMOTED,
      entityType: 'EVENT',
      entityId: eventId,
      eventId,
      title: 'Zwolniło się miejsce!',
      body: `Zostałeś automatycznie zapisany na wydarzenie "${event.title}" z listy oczekujących.`,
      dedupeKey: `waitlist-promoted-${eventId}-${candidate.userId}`,
    },
  });

  return true;
}

/**
 * Attempts to promote multiple users from waitlist.
 *
 * Useful when:
 * - Max capacity is increased
 * - Multiple users leave at once
 *
 * @param tx - Prisma transaction client
 * @param eventId - ID of the event
 * @param maxPromotions - Maximum number of users to promote (default: 10)
 * @returns Number of users promoted
 */
export async function promoteMultipleFromWaitlist(
  tx: Tx,
  eventId: string,
  maxPromotions: number = 10
): Promise<number> {
  let promoted = 0;

  for (let i = 0; i < maxPromotions; i++) {
    const success = await promoteFromWaitlist(tx, eventId);
    if (!success) {
      break; // No more candidates or capacity reached
    }
    promoted++;
  }

  return promoted;
}
