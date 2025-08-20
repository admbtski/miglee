import Fastify, { RawRequestDefaultExpression, RawServerBase } from 'fastify';

import { buildLogger } from './lib/pino';
import { cookiePlugin } from './plugins/cookie';
import { corsPlugin } from './plugins/cors';
import { healthPlugin } from './plugins/health';
import { helmetPlugin } from './plugins/helmet';
import { jwtPlugin } from './plugins/jwt';
import { mercuriusPlugin } from './plugins/mercurius';
import { sensiblePlugin } from './plugins/sensible';

import { config } from './env';
/**
 * Generate a stable request id.
 * - Reuse X-Request-Id from proxy if present.
 * - Fallback to a fast, dependency-free id.
 */
function genReqId(req: RawRequestDefaultExpression<RawServerBase>) {
  const hdr = req.headers['x-request-id'];
  if (typeof hdr === 'string' && hdr.length > 0) return hdr;
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createServer() {
  const logger = buildLogger();
  const server = Fastify({
    logger,
    genReqId,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    trustProxy: true, // honor X-Forwarded-* headers when behind a proxy
    ignoreTrailingSlash: true, // treat /path and /path/ the same
    caseSensitive: true,
  });

  // plugins
  await server.register(corsPlugin);
  await server.register(helmetPlugin);
  await server.register(sensiblePlugin);
  await server.register(cookiePlugin);
  await server.register(jwtPlugin);

  // lifecycle
  server.addHook('onRequest', async (req) => {
    (req as any).startTime = process.hrtime.bigint();
    req.log.debug({ method: req.method, url: req.url }, 'incoming request');
  });

  server.addHook('preValidation', async (req) => {
    if (req.url?.startsWith('/graphql')) {
      req.log.debug({ body: (req as any).body }, 'graphql request');
    }
  });

  server.addHook('onResponse', async (req, reply) => {
    const start = (req as any).startTime as bigint | undefined;
    const durationMs = start
      ? Number(process.hrtime.bigint() - start) / 1_000_000
      : undefined;

    req.log.debug(
      {
        statusCode: reply.statusCode,
        durationMs,
      },
      'request completed'
    );
  });

  // error handler
  server.setErrorHandler((err, req, reply) => {
    req.log.error({ err }, 'unhandled error');
    reply.status(err.statusCode ?? 500).send({
      error: 'Internal Server Error',
      message: config.isDevelopment ? err.message : 'Unexpected error',
    });
  });

  // plugins
  await server.register(healthPlugin);
  await server.register(mercuriusPlugin);

  return server;
}
