import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking EventSponsorshipPeriod records...');

  const records = await prisma.eventSponsorshipPeriod.findMany({
    select: {
      id: true,
      actionType: true,
      plan: true,
      amount: true,
      createdAt: true,
    },
  });

  console.log('Records:', JSON.stringify(records, null, 2));

  // Update empty strings to 'new'
  for (const record of records) {
    if (!record.actionType || record.actionType === '') {
      console.log(`Updating record ${record.id} with empty actionType...`);
      await prisma.eventSponsorshipPeriod.update({
        where: { id: record.id },
        data: { actionType: 'new' },
      });
    }
  }

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
