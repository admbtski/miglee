// apps/api/src/plugins/last-seen-hook.ts
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
// import { touchLastSeen } from '../lib/last-seen'; // Currently disabled

export default fp(async function lastSeenHook(app: FastifyInstance) {
  app.addHook('onRequest', async (req) => {
    const userIdFromHeader = (
      req.headers['x-user-id'] as string | undefined
    )?.trim();

    // User may be attached by auth plugin
    const user = (req as { user?: { id?: string } }).user;
    const userId = user?.id ?? userIdFromHeader;
    if (userId) {
      // void touchLastSeen(userId);
    }
  });
});
