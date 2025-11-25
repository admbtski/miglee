-- DropIndex
DROP INDEX "public"."intents_geom_idx";

-- DropIndex
DROP INDEX "public"."intents_sponsorshipPlan_idx";

-- CreateTable
CREATE TABLE "public"."event_sponsorship_periods" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "plan" "public"."IntentPlan" NOT NULL,
    "actionType" TEXT NOT NULL,
    "boostsAdded" INTEGER NOT NULL DEFAULT 0,
    "localPushesAdded" INTEGER NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'pln',
    "stripeCustomerId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_sponsorship_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_sponsorship_periods_sponsorId_idx" ON "public"."event_sponsorship_periods"("sponsorId");

-- CreateIndex
CREATE INDEX "event_sponsorship_periods_intentId_idx" ON "public"."event_sponsorship_periods"("intentId");

-- CreateIndex
CREATE INDEX "event_sponsorship_periods_createdAt_idx" ON "public"."event_sponsorship_periods"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."event_sponsorship_periods" ADD CONSTRAINT "event_sponsorship_periods_sponsorshipId_fkey" FOREIGN KEY ("intentId") REFERENCES "public"."event_sponsorships"("intentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_sponsorship_periods" ADD CONSTRAINT "event_sponsorship_periods_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "public"."intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_sponsorship_periods" ADD CONSTRAINT "event_sponsorship_periods_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
