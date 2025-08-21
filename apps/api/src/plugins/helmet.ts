import helmet from '@fastify/helmet';

import fastifyPlugin from 'fastify-plugin';
import { config } from '../env';

// todo: improve comfig
export const helmetPlugin = fastifyPlugin(async (fastify) => {
  await fastify.register(helmet, {
    contentSecurityPolicy: config.isProduction
      ? {
          useDefaults: true,
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'"],
            'style-src': ["'self'"],
            'img-src': ["'self'", 'data:'],
            'font-src': ["'self'", 'data:'],
            'connect-src': ["'self'"],
            'object-src': ["'none'"],
            'frame-ancestors': ["'none'"],
            'base-uri': ["'self'"],
            // "upgrade-insecure-requests": [] // włącz jeśli masz tylko https
          },
        }
      : false,
  });
});
