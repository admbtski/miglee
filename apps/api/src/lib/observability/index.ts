/**
 * Observability Module - Critical Path Metrics & Tracing
 *
 * Provides structured observability for high-risk operations:
 * 1. Billing & Subscriptions (highest priority)
 * 2. Membership / Join / Invite / Check-in
 * 3. Event lifecycle & publication
 * 4. DM / Chat / Comments / Reviews
 * 5. Moderation / Admin / Audit
 * 6. Notifications
 *
 * Tier-0 (additional critical paths):
 * - Permission / Authz
 * - Export / Archive
 * - Search / Map / Geo
 * - Media upload
 * - Account lifecycle
 * - Notification preferences
 *
 * Tier-1 (transaction-heavy, security-sensitive):
 * - Bulk / Reorder / Replace operations
 * - Token / Secret / Link operations
 * - Soft delete / Moderation visibility
 * - Read receipts / Unread counters
 *
 * Tier-2 (timing, rules, derivation, idempotency, security):
 * - Availability / Scheduling (timezone, DST)
 * - Business gates / Rules engines
 * - State derivation / Aggregations
 * - Idempotency / Create-or-get
 * - Dev-only endpoints security
 */

// Domain-specific observability modules
export * from './billing';
export * from './membership';
export * from './events';
export * from './messaging';
export * from './moderation';
export * from './notifications';
export * from './audit';
export * from './tracing';

// Tier-0 critical path modules
export * from './authz';
export * from './export';
export * from './geo';
export * from './media';
export * from './account';
export * from './preferences';

// Tier-1 modules (transactions, security, UX-sensitive)
export * from './bulk';
export * from './tokens';
export * from './visibility';
export * from './unread';

// Tier-2 modules (timing, rules, derivation, idempotency, security)
export * from './scheduling';
export * from './gates';
export * from './derivation';
export * from './idempotency';
export * from './security';

