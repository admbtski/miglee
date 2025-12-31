/**
 * Audit Log Creation Helper
 *
 * Provides two modes:
 * - STRICT (createAuditLog): Throws on failure, use for MUST audit items
 * - SAFE (createAuditLogSafe): Logs error but doesn't throw, use for SHOULD items
 */

import type {
  AuditScope,
  AuditAction,
  AuditActorType,
} from '../../prisma-client/enums';
import { logger } from '../pino';
import type { DiffResult } from './diff';

/**
 * Actor role can be:
 * - App role: 'ADMIN', 'MODERATOR', 'USER'
 * - Event member role: 'OWNER', 'MODERATOR', 'PARTICIPANT'
 * - Or any custom string for special cases
 */
type ActorRole = string | null;

/**
 * Transaction client type - either PrismaClient or a transaction handle
 * Using a minimal interface to support both standard and extended prisma clients
 *
 * Note: After running `prisma generate`, the eventAuditLog model will be available
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaTransactionClient = any;

/**
 * Input for creating an audit log entry
 */
export interface CreateAuditLogInput {
  /** Event ID this audit log belongs to */
  eventId: string;

  /** Category of the action */
  scope: AuditScope;

  /** Type of action performed */
  action: AuditAction;

  /** Type of entity affected (e.g., "Comment", "EventMember") */
  entityType?: string;

  /** ID of the affected entity */
  entityId?: string;

  /** Type of actor (USER, SYSTEM, INTEGRATION) */
  actorType?: AuditActorType;

  /** User ID of the actor (null for SYSTEM/INTEGRATION) */
  actorId?: string | null;

  /** Actor's role at time of action (app Role or EventMemberRole) */
  actorRole?: ActorRole;

  /** Field-level changes (from buildDiff) */
  diff?: DiffResult | null;

  /**
   * Additional context metadata
   *
   * Common fields:
   * - reason: string - Rejection/ban/cancel reason
   * - targetUserId: string - User affected by the action
   * - from/to: string - Status changes
   * - bulk: { added, updated, removed } - Bulk operation counts
   * - integration: string - For INTEGRATION actor type
   */
  meta?: Record<string, unknown> | null;

  /**
   * Severity level (1-5)
   * 1 = info, 2 = normal (default), 3 = important, 4 = critical, 5 = security
   */
  severity?: number;
}

/**
 * Create an audit log entry (STRICT mode)
 *
 * Throws on failure - use this for MUST audit items (A-level in requirements).
 * Should be called within the same transaction as the data modification.
 *
 * @param prisma - Prisma client or transaction
 * @param input - Audit log data
 * @throws Error if audit log creation fails
 *
 * @example
 * ```ts
 * await prisma.$transaction(async (tx) => {
 *   const event = await tx.event.update({ ... });
 *   await createAuditLog(tx, {
 *     eventId: event.id,
 *     scope: 'EVENT',
 *     action: 'UPDATE',
 *     actorId: userId,
 *     diff,
 *   });
 * });
 * ```
 */
export async function createAuditLog(
  prisma: PrismaTransactionClient,
  input: CreateAuditLogInput
): Promise<void> {
  await prisma.eventAuditLog.create({
    data: {
      eventId: input.eventId,
      scope: input.scope,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      actorType: input.actorType ?? 'USER',
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      diff: input.diff ?? undefined,
      meta: input.meta ?? undefined,
      severity: input.severity ?? 2,
    },
  });
}

/**
 * Create an audit log entry (SAFE mode)
 *
 * Logs error but doesn't throw - use this for SHOULD audit items (B-level).
 * Should be called after the main transaction succeeds.
 *
 * @param prisma - Prisma client (not transaction - this runs independently)
 * @param input - Audit log data
 *
 * @example
 * ```ts
 * // After successful mutation
 * await createAuditLogSafe(prisma, {
 *   eventId: event.id,
 *   scope: 'COMMENT',
 *   action: 'CREATE',
 *   actorId: userId,
 * });
 * ```
 */
export async function createAuditLogSafe(
  prisma: PrismaTransactionClient,
  input: CreateAuditLogInput
): Promise<void> {
  try {
    await createAuditLog(prisma, input);
  } catch (error) {
    // Log error but don't throw - mutation should still succeed
    logger.error(
      {
        err: error,
        eventId: input.eventId,
        scope: input.scope,
        action: input.action,
      },
      'Failed to create audit log entry (SAFE mode)'
    );
  }
}
