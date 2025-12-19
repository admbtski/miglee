/**
 * Event Audit Log System
 *
 * Provides governance audit trail for events.
 * Separate from EventCheckinLog which handles high-volume check-in operations.
 *
 * Usage:
 * - Use createAuditLog() for STRICT mode (rollback on failure) - for MUST actions
 * - Use createAuditLogSafe() for SAFE mode (log error but don't fail) - for SHOULD actions
 */

export { createAuditLog, createAuditLogSafe, type CreateAuditLogInput } from './create-audit-log';
export { buildDiff, type DiffResult } from './diff';
export { EVENT_DIFF_WHITELIST, EVENT_MEMBER_DIFF_WHITELIST, INVITE_LINK_DIFF_WHITELIST } from './whitelists';

