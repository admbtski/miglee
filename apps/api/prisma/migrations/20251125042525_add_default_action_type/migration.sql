-- AlterTable
ALTER TABLE "public"."event_sponsorship_periods" ALTER COLUMN "actionType" SET DEFAULT 'new';

-- Update existing NULL values to 'new'
UPDATE "public"."event_sponsorship_periods" SET "actionType" = 'new' WHERE "actionType" IS NULL;
