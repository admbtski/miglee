import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';

import { healthPlugin } from './plugins/health';
import { mercuriusPlugin } from './plugins/mercurius';
import { env } from './env';

export async function createServer() {
  const server = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
  });

  // Register core plugins
  await server.register(cors, {
    origin: true,
    credentials: true,
  });

  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  await server.register(sensible);

  await server.register(cookie, {
    secret: env.JWT_SECRET,
  });

  await server.register(jwt, {
    secret: env.JWT_SECRET,
  });

  // Register application plugins
  await server.register(healthPlugin);
  await server.register(mercuriusPlugin);

  return server;
}
