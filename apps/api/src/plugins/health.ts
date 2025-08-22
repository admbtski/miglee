import fastifyPlugin from 'fastify-plugin';
import { prisma } from '../lib/prisma';
import { healthRedis } from '../lib/redis';

export const healthPlugin = fastifyPlugin(async (fastify) => {
  fastify.get('/health', async (_req, reply) => {
    let redisStatus: 'ok' | 'fail' = 'fail';
    let dbStatus: 'ok' | 'fail' = 'fail';

    // Redis
    try {
      const pong = await healthRedis.ping();
      redisStatus = pong === 'PONG' ? 'ok' : 'fail';
    } catch (err) {
      fastify.log.error({ err }, '[health] Redis ping failed');
    }

    // Postgres
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'ok';
    } catch (err) {
      fastify.log.error({ err }, '[health] DB query failed');
    }

    const allOk = redisStatus === 'ok' && dbStatus === 'ok';

    reply.code(allOk ? 200 : 503);
    return { ok: allOk, db: dbStatus, redis: redisStatus };
  });
});
