import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';

export const healthPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { ok: true, db: true };
    } catch {
      return { ok: false, db: false };
    }
  });
};
