import { PrismaClient } from '@prisma/client';
import { config } from '../env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? []
        : ['query', 'info', 'warn', 'error'],
  });

if (!config.isProduction) globalForPrisma.prisma = prisma;
