/**
 * Whitelists for audit log diff generation
 *
 * These define which fields are safe to include in audit log diffs.
 * Fields NOT on these lists are excluded (e.g., tokens, counters, PII).
 */

/**
 * Event fields that can be included in audit log diffs
 *
 * EXCLUDED (for security/privacy):
 * - eventCheckinToken, geom (security)
 * - joinedCount, commentsCount, messagesCount, savedCount (derived counters)
 */
export const EVENT_DIFF_WHITELIST = [
  // Identity/content
  'title',
  'description',
  'notes',

  // Visibility/joining
  'visibility',
  'joinMode',
  'mode',
  'min',
  'max',

  // Time
  'startAt',
  'endAt',

  // Join windows
  'joinOpensMinutesBeforeStart',
  'joinCutoffMinutesBeforeStart',
  'allowJoinLate',
  'lateJoinCutoffMinutesAfterStart',

  // Manual join close
  'joinManuallyClosed',
  'joinManuallyClosedAt',
  'joinManualCloseReason',
  'joinManuallyClosedById',

  // Place
  'meetingKind',
  'onlineUrl',
  'address',
  'placeId',
  'lat',
  'lng',
  'radiusKm',
  'cityName',
  'cityPlaceId',

  // Privacy
  'addressVisibility',
  'membersVisibility',

  // Publication
  'status',
  'publishedAt',
  'scheduledPublishAt',

  // Check-in config (NOT tokens)
  'checkinEnabled',
  'enabledCheckinMethods',

  // Monetization
  'sponsorshipPlan',
  'boostedAt',
] as const;

export type EventDiffField = (typeof EVENT_DIFF_WHITELIST)[number];

/**
 * EventMember fields that can be included in audit log diffs
 *
 * EXCLUDED (for security):
 * - memberCheckinToken (security)
 * - Rejection tracking fields (tracked in meta instead)
 */
export const EVENT_MEMBER_DIFF_WHITELIST = [
  'status',
  'role',
  'checkinBlockedAll',
  'checkinBlockedMethods',
] as const;

export type EventMemberDiffField = (typeof EVENT_MEMBER_DIFF_WHITELIST)[number];

/**
 * InviteLink fields that can be included in audit log diffs
 *
 * EXCLUDED:
 * - code (should not be logged for security)
 */
export const INVITE_LINK_DIFF_WHITELIST = [
  'maxUses',
  'expiresAt',
  'label',
  'revokedAt',
] as const;

export type InviteLinkDiffField = (typeof INVITE_LINK_DIFF_WHITELIST)[number];

