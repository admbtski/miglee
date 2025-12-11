// import './lib/otel';

import Fastify, { RawRequestDefaultExpression, RawServerBase } from 'fastify';

import { buildLogger } from './lib/pino';

// Extend FastifyRequest for custom properties
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: bigint;
  }
}
import { bullBoardPlugin, queueStatsPlugin } from './plugins/bull-board';
import { cookiePlugin } from './plugins/cookie';
import { corsPlugin } from './plugins/cors';
import { gracefulShutdownPlugin } from './plugins/graceful-shutdown';
import { healthPlugin } from './plugins/health';
import { helmetPlugin } from './plugins/helmet';
import { jwtPlugin } from './plugins/jwt';
import { mercuriusPlugin } from './plugins/mercurius';
import { sensiblePlugin } from './plugins/sensible';

import { config } from './env';
// import { fastifyMetrics } from './plugins/metrics/fastify-metrics';
import { rateLimitPlugin } from './plugins/rate-limit';
import lastSeen from './plugins/last-seen';
import imageVariantsPlugin from './plugins/image-variants';
import { localUploadPlugin } from './plugins/local-upload';
import { stripeWebhookPlugin } from './plugins/stripe-webhook';
import rawBody from 'fastify-raw-body';
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
  await server.register(rateLimitPlugin);
  await server.register(corsPlugin);
  await server.register(helmetPlugin);
  await server.register(sensiblePlugin);
  await server.register(cookiePlugin);
  await server.register(jwtPlugin);
  await server.register(lastSeen);

  // Raw body plugin - needed for Stripe webhooks
  await server.register(rawBody, {
    field: 'rawBody', // adds request.rawBody
    global: false, // don't add to all routes
    encoding: 'utf8',
    runFirst: true,
    routes: ['/webhooks/stripe'], // only for this route
  });
  // await server.register(fastifyMetrics);

  // lifecycle
  server.addHook('onRequest', async (req) => {
    req.startTime = process.hrtime.bigint();

    req.log.debug({ method: req.method, url: req.url }, 'incoming request');
  });

  server.addHook('preValidation', async (req) => {
    if (req.url?.startsWith('/graphql')) {
      req.log.debug({ body: req.body }, 'graphql request');
    }
  });

  server.addHook('onResponse', async (req, reply) => {
    const start = req.startTime;
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

  // plugins - order matters!
  await server.register(healthPlugin);
  await server.register(stripeWebhookPlugin); // MUST be before mercurius (body parsing)
  await server.register(localUploadPlugin);
  await server.register(imageVariantsPlugin);
  await server.register(mercuriusPlugin); // This adds body parsing

  // Admin plugins (after auth)
  await server.register(queueStatsPlugin);
  await server.register(bullBoardPlugin);

  // Graceful shutdown - register last to ensure all hooks are set up
  await server.register(gracefulShutdownPlugin);

  return server;
}
