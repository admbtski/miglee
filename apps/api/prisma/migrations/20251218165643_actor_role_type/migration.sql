/*
  Warnings:

  - The `actorRole` column on the `event_audit_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."event_audit_logs" DROP COLUMN "actorRole",
ADD COLUMN     "actorRole" TEXT;
