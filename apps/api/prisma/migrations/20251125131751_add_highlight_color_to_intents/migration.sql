-- DropIndex
DROP INDEX "public"."idx_intents_boosted_at_desc";

-- AlterTable
ALTER TABLE "public"."intents" ADD COLUMN     "highlightColor" TEXT;
