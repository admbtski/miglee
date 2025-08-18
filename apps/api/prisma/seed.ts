import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sportsEvents = [
  'Champions League Final',
  'World Cup Semi-Final',
  'NBA Championship Game 7',
  'Super Bowl LVIII',
  'Wimbledon Men\'s Final',
  'Formula 1 Monaco Grand Prix',
  'UEFA Euro 2024 Final',
  'Olympic 100m Final',
  'Stanley Cup Final Game 6',
  'Masters Tournament Final Round',
];

async function main() {
  // Clear existing data
  await prisma.event.deleteMany();

  // Anchor date: January 15, 2025, 00:00:00 UTC
  const anchorDate = new Date(Date.UTC(2025, 0, 15));

  // Create 10 events, each 1 day earlier than the previous
  const events = sportsEvents.map((title, index) => {
    const createdAt = new Date(anchorDate.getTime() - (index * 24 * 60 * 60 * 1000));
    return {
      title,
      createdAt,
    };
  });

  // Insert events
  for (const event of events) {
    await prisma.event.create({
      data: event,
    });
  }

  console.log(`Seeded ${events.length} events successfully`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
