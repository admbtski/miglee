/*
  Warnings:

  - The `status` column on the `events` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED');

-- AlterTable
ALTER TABLE "public"."events" DROP COLUMN "status",
ADD COLUMN     "status" "public"."PublicationStatus" NOT NULL DEFAULT 'DRAFT';

-- DropEnum
DROP TYPE "public"."EventStatus";

-- CreateIndex
CREATE INDEX "events_status_idx" ON "public"."events"("status");

-- CreateIndex
CREATE INDEX "events_status_visibility_startAt_idx" ON "public"."events"("status", "visibility", "startAt");
