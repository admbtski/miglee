import rateLimit from '@fastify/rate-limit';
import fastifyPlugin from 'fastify-plugin';

// todo: improve comfig
export const rateLimitPlugin = fastifyPlugin(async (fastify) => {
  await fastify.register(rateLimit, {
    global: false,
    max: 100,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'],
    // redis,                       // współdzielone limity między instancjami
    addHeadersOnExceeding: { 'x-ratelimit-remaining': true },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    keyGenerator: (req) => {
      const userId = (req as any).user?.id;
      const ua = req.headers['user-agent'] || '';
      if (userId) return `u:${userId}`;
      return `ip:${req.ip}|ua:${ua.slice(0, 32)}`;
    },
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry after ${Math.ceil(context.ttl / 1000)}s`,
    }),
  });
});
