/*
  Warnings:

  - The `status` column on the `intents` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED');

-- AlterTable
ALTER TABLE "public"."intents" DROP COLUMN "status",
ADD COLUMN     "status" "public"."PublicationStatus" NOT NULL DEFAULT 'DRAFT';

-- DropEnum
DROP TYPE "public"."IntentStatus";

-- CreateIndex
CREATE INDEX "intents_status_idx" ON "public"."intents"("status");

-- CreateIndex
CREATE INDEX "intents_status_visibility_startAt_idx" ON "public"."intents"("status", "visibility", "startAt");
