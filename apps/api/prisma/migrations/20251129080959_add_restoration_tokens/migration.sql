-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "restorationToken" TEXT,
ADD COLUMN     "restorationTokenExpiry" TIMESTAMP(3);
