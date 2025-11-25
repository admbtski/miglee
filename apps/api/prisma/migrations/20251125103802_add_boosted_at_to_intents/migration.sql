-- AlterTable
ALTER TABLE "public"."intents" ADD COLUMN     "boostedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "intents_boostedAt_idx" ON "public"."intents"("boostedAt");
