/**
 * Waitlist Management Utilities
 *
 * This module provides core functionality for managing event waitlists:
 * - Join window validation (canStillJoin)
 * - Auto-promotion from waitlist to joined (promoteFromWaitlist)
 * - Race condition protection via optimistic locking
 */

import type { Prisma } from '@prisma/client';
import {
  IntentMemberStatus,
  MemberEvent,
  NotificationKind,
} from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

type Tx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Intent data required for join window evaluation
 */
export interface JoinWindowIntent {
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
 * Evaluates whether users can still join an intent based on time windows and settings.
 *
 * This is the single source of truth for join window logic.
 * Used by: joinMember, joinWaitlist, approveMembership, promoteFromWaitlist
 *
 * @param intent - Intent with timing and join settings
 * @param now - Current time (defaults to new Date())
 * @returns Object indicating if join window is open and reason if closed
 */
export function canStillJoin(
  intent: JoinWindowIntent,
  now: Date = new Date()
): JoinWindowResult {
  // Event canceled or deleted
  if (intent.canceledAt) {
    return { open: false, reason: 'CANCELED' };
  }
  if (intent.deletedAt) {
    return { open: false, reason: 'DELETED' };
  }

  // Manually closed by host/mod
  if (intent.joinManuallyClosed) {
    return { open: false, reason: 'MANUALLY_CLOSED' };
  }

  const start = new Date(intent.startAt);
  const end = new Date(intent.endAt);

  // Pre-open window (optional)
  if (
    intent.joinOpensMinutesBeforeStart != null &&
    now <
      new Date(start.getTime() - intent.joinOpensMinutesBeforeStart * 60_000)
  ) {
    return { open: false, reason: 'NOT_OPEN_YET' };
  }

  // Cutoff before start (optional)
  if (
    intent.joinCutoffMinutesBeforeStart != null &&
    now >=
      new Date(
        start.getTime() - intent.joinCutoffMinutesBeforeStart * 60_000
      ) &&
    now < start
  ) {
    return { open: false, reason: 'PRE_START_CUTOFF' };
  }

  // After start
  if (now >= start) {
    if (!intent.allowJoinLate) {
      return { open: false, reason: 'LATE_JOIN_DISABLED' };
    }
    if (
      intent.lateJoinCutoffMinutesAfterStart != null &&
      now >=
        new Date(
          start.getTime() + intent.lateJoinCutoffMinutesAfterStart * 60_000
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
 * @param intentId - ID of the intent
 * @returns true if someone was promoted, false otherwise
 */
export async function promoteFromWaitlist(
  tx: Tx,
  intentId: string
): Promise<boolean> {
  // 1. Load intent with current state
  const intent = await tx.intent.findUnique({
    where: { id: intentId },
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

  if (!intent) {
    return false;
  }

  // 2. Check join window
  const joinWindow = canStillJoin(intent);
  if (!joinWindow.open) {
    return false;
  }

  // 3. Check capacity
  if (intent.joinedCount >= intent.max) {
    return false;
  }

  // 4. Find next candidate (FIFO)
  const candidate = await tx.intentMember.findFirst({
    where: {
      intentId,
      status: IntentMemberStatus.WAITLIST,
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
  const updated = await tx.intent.updateMany({
    where: {
      id: intentId,
      joinedCount: { lt: intent.max }, // Only update if still under capacity
    },
    data: { joinedCount: { increment: 1 } },
  });

  if (updated.count === 0) {
    // Someone else took the last slot - abort
    return false;
  }

  // 6. Promote user
  await tx.intentMember.update({
    where: { id: candidate.id },
    data: {
      status: IntentMemberStatus.JOINED,
      joinedAt: new Date(),
    },
  });

  // 7. Create audit event
  await tx.intentMemberEvent.create({
    data: {
      intentId,
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
      entityType: 'INTENT',
      entityId: intentId,
      intentId,
      title: 'Zwolniło się miejsce!',
      body: `Zostałeś automatycznie zapisany na wydarzenie "${intent.title}" z listy oczekujących.`,
      dedupeKey: `waitlist-promoted-${intentId}-${candidate.userId}`,
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
 * @param intentId - ID of the intent
 * @param maxPromotions - Maximum number of users to promote (default: 10)
 * @returns Number of users promoted
 */
export async function promoteMultipleFromWaitlist(
  tx: Tx,
  intentId: string,
  maxPromotions: number = 10
): Promise<number> {
  let promoted = 0;

  for (let i = 0; i < maxPromotions; i++) {
    const success = await promoteFromWaitlist(tx, intentId);
    if (!success) {
      break; // No more candidates or capacity reached
    }
    promoted++;
  }

  return promoted;
}
