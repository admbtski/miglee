/*
  Warnings:

  - You are about to drop the column `highlightColor` on the `events` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED');

-- AlterTable
ALTER TABLE "public"."events" DROP COLUMN "highlightColor",
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledPublishAt" TIMESTAMP(3),
ADD COLUMN     "status" "public"."EventStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "events_status_idx" ON "public"."events"("status");

-- CreateIndex
CREATE INDEX "events_status_visibility_startAt_idx" ON "public"."events"("status", "visibility", "startAt");

-- CreateIndex
CREATE INDEX "events_scheduledPublishAt_idx" ON "public"."events"("scheduledPublishAt");
