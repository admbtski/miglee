-- CreateEnum
CREATE TYPE "UserAuditAction" AS ENUM ('UPDATE_ROLE', 'UPDATE_VERIFIED', 'SUSPEND', 'UNSUSPEND', 'DELETE', 'UPDATE_PROFILE', 'CREATE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "suspendedById" TEXT,
ADD COLUMN     "suspendedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "user_audit_logs" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "action" "UserAuditAction" NOT NULL,
    "actorId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "diff" JSONB,
    "reason" TEXT,
    "meta" JSONB,
    "severity" INTEGER NOT NULL DEFAULT 3,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_audit_logs_targetUserId_createdAt_idx" ON "user_audit_logs"("targetUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "user_audit_logs_actorId_createdAt_idx" ON "user_audit_logs"("actorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "user_audit_logs_action_createdAt_idx" ON "user_audit_logs"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "user_audit_logs_createdAt_idx" ON "user_audit_logs"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_suspendedById_fkey" FOREIGN KEY ("suspendedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_audit_logs" ADD CONSTRAINT "user_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
