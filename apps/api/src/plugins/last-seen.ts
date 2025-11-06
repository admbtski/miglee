// apps/api/src/plugins/last-seen-hook.ts
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { touchLastSeen } from '../lib/last-seen';

export default fp(async function lastSeenHook(app: FastifyInstance) {
  app.addHook('onRequest', async (req) => {
    const userIdFromHeader = (
      req.headers['x-user-id'] as string | undefined
    )?.trim();

    const userId = (req as any).user?.id ?? userIdFromHeader;
    if (userId) {
      // void touchLastSeen(userId);
    }
  });
});
