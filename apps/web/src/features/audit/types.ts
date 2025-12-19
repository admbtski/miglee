/**
 * Audit Log Types
 */

export type AuditScope =
  | 'EVENT'
  | 'PUBLICATION'
  | 'MEMBER'
  | 'MODERATION'
  | 'CHECKIN'
  | 'INVITE_LINK'
  | 'COMMENT'
  | 'REVIEW'
  | 'AGENDA'
  | 'FAQ'
  | 'BILLING'
  | 'SYSTEM';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PUBLISH'
  | 'UNPUBLISH'
  | 'SCHEDULE'
  | 'CANCEL'
  | 'STATUS_CHANGE'
  | 'ROLE_CHANGE'
  | 'INVITE'
  | 'APPROVE'
  | 'REJECT'
  | 'KICK'
  | 'BAN'
  | 'UNBAN'
  | 'LEAVE'
  | 'CONFIG_CHANGE'
  | 'HIDE'
  | 'UNHIDE'
  | 'WAITLIST'
  | 'WAITLIST_LEAVE'
  | 'WAITLIST_PROMOTE';

export type AuditActorType = 'USER' | 'SYSTEM' | 'INTEGRATION';

export interface AuditLogItem {
  id: string;
  eventId: string;
  scope: AuditScope;
  action: AuditAction;
  entityType?: string | null;
  entityId?: string | null;
  actorType: AuditActorType;
  actorId?: string | null;
  actorRole?: string | null;
  diff?: Record<string, { from: unknown; to: unknown }> | null;
  meta?: Record<string, unknown> | null;
  severity: number;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    avatarKey?: string | null;
  } | null;
}

export interface AuditLogsFilter {
  scope?: AuditScope[];
  action?: AuditAction[];
  actorId?: string;
  from?: string;
  to?: string;
}

