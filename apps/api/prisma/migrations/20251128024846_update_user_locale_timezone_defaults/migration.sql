/*
  Warnings:

  - You are about to drop the column `tz` on the `users` table. All the data in the column will be lost.
  - Made the column `locale` on table `users` required. This step will fail if there are existing NULL values in that column.

*/

-- Step 1: Fill NULL locale values with 'en' before making it NOT NULL
UPDATE "public"."users" SET "locale" = 'en' WHERE "locale" IS NULL;

-- Step 2: Create new timezone column with default 'UTC', copy tz values if they exist
ALTER TABLE "public"."users" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- Step 3: Copy existing tz values to timezone (if tz is not null)
UPDATE "public"."users" SET "timezone" = "tz" WHERE "tz" IS NOT NULL;

-- Step 4: Drop old tz column
ALTER TABLE "public"."users" DROP COLUMN "tz";

-- Step 5: Make locale NOT NULL with default 'en'
ALTER TABLE "public"."users" 
  ALTER COLUMN "locale" SET NOT NULL,
  ALTER COLUMN "locale" SET DEFAULT 'en';
