-- DropIndex
DROP INDEX "public"."events_geom_idx";

-- CreateTable
CREATE TABLE "public"."event_appearances" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_appearances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_appearances_eventId_key" ON "public"."event_appearances"("eventId");

-- AddForeignKey
ALTER TABLE "public"."event_appearances" ADD CONSTRAINT "event_appearances_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
