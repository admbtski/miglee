-- DropIndex
DROP INDEX "public"."intents_geom_idx";

-- CreateTable
CREATE TABLE "public"."intent_appearances" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intent_appearances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intent_appearances_intentId_key" ON "public"."intent_appearances"("intentId");

-- AddForeignKey
ALTER TABLE "public"."intent_appearances" ADD CONSTRAINT "intent_appearances_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "public"."intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
