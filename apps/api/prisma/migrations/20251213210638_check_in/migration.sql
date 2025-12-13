/*
  Warnings:

  - A unique constraint covering the columns `[memberCheckinToken]` on the table `event_members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventCheckinToken]` on the table `events` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."CheckinMethod" AS ENUM ('SELF_MANUAL', 'MODERATOR_PANEL', 'EVENT_QR', 'USER_QR');

-- CreateEnum
CREATE TYPE "public"."CheckinAction" AS ENUM ('CHECK_IN', 'UNCHECK', 'REJECT', 'BLOCK_ALL', 'UNBLOCK_ALL', 'BLOCK_METHOD', 'UNBLOCK_METHOD', 'QR_TOKEN_ROTATED', 'METHODS_CHANGED', 'ATTEMPT_DENIED');

-- CreateEnum
CREATE TYPE "public"."CheckinSource" AS ENUM ('USER', 'MODERATOR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."CheckinResult" AS ENUM ('SUCCESS', 'DENIED', 'NOOP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationKind" ADD VALUE 'CHECKIN_CONFIRMED';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'CHECKIN_REJECTED';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'CHECKIN_BLOCKED';
ALTER TYPE "public"."NotificationKind" ADD VALUE 'CHECKIN_UNBLOCKED';

-- AlterTable
ALTER TABLE "public"."event_members" ADD COLUMN     "checkinBlockedAll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checkinBlockedMethods" "public"."CheckinMethod"[] DEFAULT ARRAY[]::"public"."CheckinMethod"[],
ADD COLUMN     "checkinMethods" "public"."CheckinMethod"[] DEFAULT ARRAY[]::"public"."CheckinMethod"[],
ADD COLUMN     "isCheckedIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastCheckinAt" TIMESTAMP(3),
ADD COLUMN     "lastCheckinRejectedAt" TIMESTAMP(3),
ADD COLUMN     "lastCheckinRejectedById" TEXT,
ADD COLUMN     "lastCheckinRejectionReason" TEXT,
ADD COLUMN     "memberCheckinToken" TEXT;

-- AlterTable
ALTER TABLE "public"."events" ADD COLUMN     "checkinEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enabledCheckinMethods" "public"."CheckinMethod"[] DEFAULT ARRAY[]::"public"."CheckinMethod"[],
ADD COLUMN     "eventCheckinToken" TEXT;

-- CreateTable
CREATE TABLE "public"."event_checkin_logs" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "public"."CheckinAction" NOT NULL,
    "method" "public"."CheckinMethod",
    "source" "public"."CheckinSource" NOT NULL,
    "result" "public"."CheckinResult" NOT NULL,
    "reason" TEXT,
    "comment" TEXT,
    "showCommentToUser" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventMemberId" TEXT,

    CONSTRAINT "event_checkin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_checkin_logs_eventId_createdAt_idx" ON "public"."event_checkin_logs"("eventId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "event_checkin_logs_memberId_createdAt_idx" ON "public"."event_checkin_logs"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "event_checkin_logs_eventId_action_idx" ON "public"."event_checkin_logs"("eventId", "action");

-- CreateIndex
CREATE INDEX "event_checkin_logs_eventId_method_idx" ON "public"."event_checkin_logs"("eventId", "method");

-- CreateIndex
CREATE INDEX "event_checkin_logs_actorId_createdAt_idx" ON "public"."event_checkin_logs"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_members_memberCheckinToken_key" ON "public"."event_members"("memberCheckinToken");

-- CreateIndex
CREATE INDEX "event_members_eventId_isCheckedIn_idx" ON "public"."event_members"("eventId", "isCheckedIn");

-- CreateIndex
CREATE INDEX "event_members_eventId_status_isCheckedIn_idx" ON "public"."event_members"("eventId", "status", "isCheckedIn");

-- CreateIndex
CREATE UNIQUE INDEX "events_eventCheckinToken_key" ON "public"."events"("eventCheckinToken");

-- AddForeignKey
ALTER TABLE "public"."event_members" ADD CONSTRAINT "event_members_lastCheckinRejectedById_fkey" FOREIGN KEY ("lastCheckinRejectedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_checkin_logs" ADD CONSTRAINT "event_checkin_logs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_checkin_logs" ADD CONSTRAINT "event_checkin_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_checkin_logs" ADD CONSTRAINT "event_checkin_logs_eventMemberId_fkey" FOREIGN KEY ("eventMemberId") REFERENCES "public"."event_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
