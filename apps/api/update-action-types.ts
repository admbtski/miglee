import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating NULL actionType values to "new"...');

  const result = await prisma.$executeRaw`
    UPDATE "public"."event_sponsorship_periods" 
    SET "actionType" = 'new' 
    WHERE "actionType" IS NULL;
  `;

  console.log(`Updated ${result} records.`);

  // Verify
  const count = await prisma.eventSponsorshipPeriod.count();
  console.log(`Total EventSponsorshipPeriod records: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
