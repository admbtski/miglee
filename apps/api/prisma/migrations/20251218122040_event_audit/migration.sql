-- CreateEnum
CREATE TYPE "public"."AuditScope" AS ENUM ('EVENT', 'PUBLICATION', 'MEMBER', 'MODERATION', 'CHECKIN', 'INVITE_LINK', 'COMMENT', 'REVIEW', 'AGENDA', 'FAQ', 'BILLING', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH', 'SCHEDULE', 'CANCEL', 'STATUS_CHANGE', 'ROLE_CHANGE', 'INVITE', 'APPROVE', 'REJECT', 'KICK', 'BAN', 'UNBAN', 'LEAVE', 'CONFIG_CHANGE', 'HIDE', 'UNHIDE', 'WAITLIST', 'WAITLIST_LEAVE', 'WAITLIST_PROMOTE');

-- CreateEnum
CREATE TYPE "public"."AuditActorType" AS ENUM ('USER', 'SYSTEM', 'INTEGRATION');

-- CreateTable
CREATE TABLE "public"."event_audit_logs" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "scope" "public"."AuditScope" NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "actorType" "public"."AuditActorType" NOT NULL DEFAULT 'USER',
    "actorId" TEXT,
    "actorRole" "public"."Role",
    "diff" JSONB,
    "meta" JSONB,
    "severity" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_audit_logs_eventId_createdAt_idx" ON "public"."event_audit_logs"("eventId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "event_audit_logs_eventId_scope_createdAt_idx" ON "public"."event_audit_logs"("eventId", "scope", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "event_audit_logs_eventId_scope_action_createdAt_idx" ON "public"."event_audit_logs"("eventId", "scope", "action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "event_audit_logs_actorId_createdAt_idx" ON "public"."event_audit_logs"("actorId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "public"."event_audit_logs" ADD CONSTRAINT "event_audit_logs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_audit_logs" ADD CONSTRAINT "event_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
