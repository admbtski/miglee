import fastifyPlugin from 'fastify-plugin';
import { prisma } from '../lib/prisma';

// todo: improve comfig
export const healthPlugin = fastifyPlugin(async (fastify) => {
  fastify.get('/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { ok: true, db: true };
    } catch {
      return { ok: false, db: false };
    }
  });
});
