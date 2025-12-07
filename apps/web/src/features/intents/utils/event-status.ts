/**
 * Shared utilities for computing event status across different components
 * Eliminates code duplication between EventCard, PopupItem, and EventDetail
 */

import { computeJoinState, type JoinStateResult } from './intent-join-state';
import type { JoinTone, JoinReason } from '@/components/ui/status-badge';

export type EventStatus = {
  label: string;
  tone: JoinTone;
  reason: JoinReason;
};

export type EventStatusInput = {
  isDeleted: boolean;
  isCanceled: boolean;
  isOngoing: boolean;
  hasStarted: boolean;
  joinState: JoinStateResult | null;
};

/**
 * Compute event status from join state and event flags
 * This is the single source of truth for status computation
 */
export function computeEventStatus(input: EventStatusInput): EventStatus {
  const { isDeleted, isCanceled, isOngoing, hasStarted, joinState } = input;

  // Priority 1: Deleted
  if (isDeleted) {
    return {
      label: 'Usunięte',
      tone: 'error',
      reason: 'DELETED',
    };
  }

  // Priority 2: Canceled
  if (isCanceled) {
    return {
      label: 'Odwołane',
      tone: 'warn',
      reason: 'CANCELED',
    };
  }

  // Priority 3: Ongoing
  if (isOngoing) {
    return {
      label: 'Trwa teraz',
      tone: 'info',
      reason: 'ONGOING',
    };
  }

  // Priority 4: Join state checks
  if (joinState) {
    if (joinState.isManuallyClosed) {
      return {
        label: 'Zablokowane',
        tone: 'error',
        reason: 'LOCK',
      };
    }

    if (joinState.isBeforeOpen) {
      return {
        label: 'Wkrótce',
        tone: 'warn',
        reason: 'LOCK',
      };
    }

    if (joinState.isPreCutoffClosed) {
      return {
        label: 'Zablokowane',
        tone: 'error',
        reason: 'LOCK',
      };
    }

    if (joinState.isFull) {
      return {
        label: 'Brak miejsc',
        tone: 'error',
        reason: 'FULL',
      };
    }
  }

  // Priority 5: Started (but not ongoing)
  if (hasStarted) {
    return {
      label: 'Rozpoczęte',
      tone: 'error',
      reason: 'STARTED',
    };
  }

  // Default: Available
  return {
    label: 'Dostępne',
    tone: 'ok',
    reason: 'OK',
  };
}

/**
 * Compute both join state and event status in one go
 * Use this when you need both values
 */
export function computeEventStateAndStatus(params: {
  now: Date;
  startAt: Date;
  endAt: Date;
  isDeleted: boolean;
  isCanceled: boolean;
  isOngoing: boolean;
  hasStarted: boolean;
  joinOpensMinutesBeforeStart?: number | null;
  joinCutoffMinutesBeforeStart?: number | null;
  allowJoinLate?: boolean;
  lateJoinCutoffMinutesAfterStart?: number | null;
  joinManuallyClosed?: boolean;
  min: number;
  max: number;
  joinedCount: number;
  joinMode?: 'OPEN' | 'REQUEST' | 'INVITE_ONLY';
}) {
  // Skip computeJoinState if canceled or deleted
  const joinState =
    params.isDeleted || params.isCanceled
      ? null
      : computeJoinState(params.now, {
          startAt: params.startAt,
          endAt: params.endAt,
          joinOpensMinutesBeforeStart: params.joinOpensMinutesBeforeStart,
          joinCutoffMinutesBeforeStart: params.joinCutoffMinutesBeforeStart,
          allowJoinLate: params.allowJoinLate ?? true,
          lateJoinCutoffMinutesAfterStart:
            params.lateJoinCutoffMinutesAfterStart,
          joinManuallyClosed: params.joinManuallyClosed ?? false,
          min: params.min,
          max: params.max,
          joinedCount: params.joinedCount,
          joinMode: params.joinMode ?? 'OPEN',
        });

  const status = computeEventStatus({
    isDeleted: params.isDeleted,
    isCanceled: params.isCanceled,
    isOngoing: params.isOngoing,
    hasStarted: params.hasStarted,
    joinState,
  });

  return { joinState, status };
}
