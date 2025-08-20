import cors from '@fastify/cors';
import { FastifyPluginAsync } from 'fastify';
import { buildCorsChecker } from '../lib/cors';

// todo: improve comfig
export const corsPlugin: FastifyPluginAsync = async (fastify) => {
  const isProd = process.env.NODE_ENV === 'production';
  const allowOrigin = buildCorsChecker(process.env.CORS_ORIGINS, !isProd);

  await fastify.register(cors, {
    origin: (origin, cb) => {
      try {
        if (allowOrigin(origin)) return cb(null, true);
        return cb(new Error('CORS: origin not allowed'), false);
      } catch (e) {
        return cb(e as Error, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length'],
  });
};
