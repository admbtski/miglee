-- CreateEnum
CREATE TYPE "public"."AgendaHostKind" AS ENUM ('USER', 'MANUAL');

-- CreateTable
CREATE TABLE "public"."event_agenda_items" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_agenda_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_agenda_item_hosts" (
    "id" TEXT NOT NULL,
    "agendaItemId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "kind" "public"."AgendaHostKind" NOT NULL DEFAULT 'USER',
    "userId" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_agenda_item_hosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_agenda_items_eventId_order_idx" ON "public"."event_agenda_items"("eventId", "order");

-- CreateIndex
CREATE INDEX "event_agenda_item_hosts_agendaItemId_order_idx" ON "public"."event_agenda_item_hosts"("agendaItemId", "order");

-- AddForeignKey
ALTER TABLE "public"."event_agenda_items" ADD CONSTRAINT "event_agenda_items_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_agenda_item_hosts" ADD CONSTRAINT "event_agenda_item_hosts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_agenda_item_hosts" ADD CONSTRAINT "event_agenda_item_hosts_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "public"."event_agenda_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
