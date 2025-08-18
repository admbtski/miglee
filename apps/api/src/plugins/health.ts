import { FastifyPluginAsync } from 'fastify';

export const healthPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => {
    return { ok: true };
  });
};
