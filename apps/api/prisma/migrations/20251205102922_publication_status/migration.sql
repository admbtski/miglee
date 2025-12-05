/*
  Warnings:

  - You are about to drop the column `highlightColor` on the `intents` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."IntentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED');

-- AlterTable
ALTER TABLE "public"."intents" DROP COLUMN "highlightColor",
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledPublishAt" TIMESTAMP(3),
ADD COLUMN     "status" "public"."IntentStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "intents_status_idx" ON "public"."intents"("status");

-- CreateIndex
CREATE INDEX "intents_status_visibility_startAt_idx" ON "public"."intents"("status", "visibility", "startAt");

-- CreateIndex
CREATE INDEX "intents_scheduledPublishAt_idx" ON "public"."intents"("scheduledPublishAt");
