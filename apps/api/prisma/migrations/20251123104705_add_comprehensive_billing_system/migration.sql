-- ========================================================================================
-- Comprehensive Billing System Migration
-- Adds support for user subscriptions, one-off payments, and event sponsorships
-- ========================================================================================

-- CreateEnum: UserPlanSource
CREATE TYPE "public"."UserPlanSource" AS ENUM ('SUBSCRIPTION', 'ONE_OFF');

-- CreateEnum: BillingPeriod
CREATE TYPE "public"."BillingPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum: IntentPlan
CREATE TYPE "public"."IntentPlan" AS ENUM ('FREE', 'PLUS', 'PRO');

-- AlterEnum: SubscriptionPlan (remove BASIC, keep PLUS and PRO)
-- We need to handle existing data gracefully
DO $$
BEGIN
  -- Update any BASIC subscriptions to PLUS before changing enum
  UPDATE "public"."user_subscriptions" SET "plan" = 'PLUS' WHERE "plan" = 'BASIC';
  
  -- Now alter the enum
  ALTER TYPE "public"."SubscriptionPlan" RENAME TO "SubscriptionPlan_old";
  CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('PLUS', 'PRO');
  
  -- Update user_subscriptions table
  ALTER TABLE "public"."user_subscriptions" 
    ALTER COLUMN "plan" DROP DEFAULT,
    ALTER COLUMN "plan" TYPE "public"."SubscriptionPlan" USING ("plan"::text::"public"."SubscriptionPlan");
  
  DROP TYPE "public"."SubscriptionPlan_old";
END $$;

-- DropEnum: SponsorPlan (replaced by IntentPlan)
-- First, migrate data from event_sponsorships
DO $$
BEGIN
  -- Add temporary column for migration
  ALTER TABLE "public"."event_sponsorships" ADD COLUMN "plan_new" "public"."IntentPlan";
  
  -- Migrate data: BASIC -> PLUS, PLUS -> PLUS, PRO -> PRO
  UPDATE "public"."event_sponsorships" 
  SET "plan_new" = CASE 
    WHEN "plan"::text = 'BASIC' THEN 'PLUS'
    WHEN "plan"::text = 'PLUS' THEN 'PLUS'
    WHEN "plan"::text = 'PRO' THEN 'PRO'
    ELSE 'PLUS'
  END::"public"."IntentPlan";
  
  -- Drop old column and rename new
  ALTER TABLE "public"."event_sponsorships" DROP COLUMN "plan";
  ALTER TABLE "public"."event_sponsorships" RENAME COLUMN "plan_new" TO "plan";
  ALTER TABLE "public"."event_sponsorships" ALTER COLUMN "plan" SET NOT NULL;
END $$;

-- Drop the old SponsorPlan enum
DROP TYPE IF EXISTS "public"."SponsorPlan";

-- ========================================================================================
-- AlterTable: user_subscriptions
-- Add new fields for billing and trial
-- ========================================================================================
ALTER TABLE "public"."user_subscriptions" 
  ADD COLUMN "billingPeriod" "public"."BillingPeriod" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN "trialEndsAt" TIMESTAMP(3),
  ALTER COLUMN "stripeCustomerId" SET NOT NULL;

-- ========================================================================================
-- AlterTable: event_sponsorships
-- Refactor to match new sponsorship model
-- ========================================================================================
ALTER TABLE "public"."event_sponsorships" 
  DROP COLUMN IF EXISTS "highlightOn",
  DROP COLUMN IF EXISTS "localPushes",
  DROP COLUMN IF EXISTS "startedAt",
  ADD COLUMN "boostsTotal" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "localPushesTotal" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "localPushesUsed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "startsAt" TIMESTAMP(3),
  ADD COLUMN "stripeCheckoutSessionId" TEXT,
  ADD COLUMN "stripePaymentIntentId" TEXT;

-- Migrate startedAt -> startsAt if data exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'event_sponsorships' 
      AND column_name = 'started_at'
  ) THEN
    UPDATE "public"."event_sponsorships" SET "startsAt" = "started_at" WHERE "started_at" IS NOT NULL;
    ALTER TABLE "public"."event_sponsorships" DROP COLUMN "started_at";
  END IF;
END $$;

-- ========================================================================================
-- AlterTable: intents
-- Add sponsorshipPlan field (note: we preserve the PostGIS geom column)
-- ========================================================================================
ALTER TABLE "public"."intents" 
  ADD COLUMN "sponsorshipPlan" "public"."IntentPlan" NOT NULL DEFAULT 'FREE';

-- Sync sponsorshipPlan from existing event_sponsorships
UPDATE "public"."intents" i
SET "sponsorshipPlan" = es."plan"
FROM "public"."event_sponsorships" es
WHERE i."id" = es."intentId" AND es."status" = 'ACTIVE';

-- ========================================================================================
-- CreateTable: user_plan_periods
-- Stores all active plan periods for users (subscriptions and one-off payments)
-- ========================================================================================
CREATE TABLE "public"."user_plan_periods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "public"."SubscriptionPlan" NOT NULL,
    "source" "public"."UserPlanSource" NOT NULL,
    "billingPeriod" "public"."BillingPeriod" NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_plan_periods_pkey" PRIMARY KEY ("id")
);

-- ========================================================================================
-- Create Indexes
-- ========================================================================================

-- Indexes for user_plan_periods
CREATE INDEX "user_plan_periods_userId_endsAt_idx" ON "public"."user_plan_periods"("userId", "endsAt");
CREATE INDEX "user_plan_periods_stripeSubscriptionId_idx" ON "public"."user_plan_periods"("stripeSubscriptionId");
CREATE INDEX "user_plan_periods_stripePaymentIntentId_idx" ON "public"."user_plan_periods"("stripePaymentIntentId");

-- Recreate index for event_sponsorships (plan changed type)
DROP INDEX IF EXISTS "public"."event_sponsorships_plan_status_idx";
CREATE INDEX "event_sponsorships_plan_status_idx" ON "public"."event_sponsorships"("plan", "status");

-- Index for intents sponsorshipPlan
CREATE INDEX "intents_sponsorshipPlan_idx" ON "public"."intents"("sponsorshipPlan");

-- ========================================================================================
-- AddForeignKey
-- ========================================================================================
ALTER TABLE "public"."user_plan_periods" 
  ADD CONSTRAINT "user_plan_periods_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================================================================
-- Migrate existing subscription data to user_plan_periods
-- ========================================================================================
INSERT INTO "public"."user_plan_periods" 
  ("id", "userId", "plan", "source", "billingPeriod", "stripeCustomerId", "stripeSubscriptionId", "startsAt", "endsAt", "createdAt")
SELECT 
  'period_' || us."id" as "id",
  us."userId",
  us."plan",
  'SUBSCRIPTION'::"public"."UserPlanSource" as "source",
  us."billingPeriod",
  us."stripeCustomerId",
  us."stripeSubscriptionId",
  us."currentPeriodStart",
  us."currentPeriodEnd",
  us."createdAt"
FROM "public"."user_subscriptions" us
WHERE us."status" IN ('ACTIVE', 'TRIALING') 
  AND us."currentPeriodStart" IS NOT NULL 
  AND us."currentPeriodEnd" IS NOT NULL
  AND us."currentPeriodEnd" > NOW();

