-- DropIndex
DROP INDEX IF EXISTS "user_subscriptions_stripeSubscriptionId_idx";

-- Step 1: Delete any duplicate subscriptions (keep the most recent one)
DELETE FROM "user_subscriptions" a USING (
  SELECT "stripeSubscriptionId", MAX("createdAt") as max_created
  FROM "user_subscriptions"
  WHERE "stripeSubscriptionId" IS NOT NULL
  GROUP BY "stripeSubscriptionId"
  HAVING COUNT(*) > 1
) b
WHERE a."stripeSubscriptionId" = b."stripeSubscriptionId" 
  AND a."createdAt" < b.max_created;

-- Step 2: AlterTable - make stripeSubscriptionId NOT NULL (set a temp value for nulls)
UPDATE "user_subscriptions" 
SET "stripeSubscriptionId" = 'temp_' || "id" 
WHERE "stripeSubscriptionId" IS NULL;

ALTER TABLE "user_subscriptions" ALTER COLUMN "stripeSubscriptionId" SET NOT NULL;

-- Step 3: CreateIndex - add unique constraint
CREATE UNIQUE INDEX "user_subscriptions_stripeSubscriptionId_key" ON "user_subscriptions"("stripeSubscriptionId");

