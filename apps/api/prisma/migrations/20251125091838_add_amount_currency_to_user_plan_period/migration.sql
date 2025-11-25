-- AlterTable
ALTER TABLE "public"."user_plan_periods" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'pln';
