import jwt from '@fastify/jwt';
import fastifyPlugin from 'fastify-plugin';
import { config } from '../env';

// todo: improve comfig
export const jwtPlugin = fastifyPlugin(async (fastify) => {
  await fastify.register(jwt, {
    secret: config.jwtSecret,
    cookie: {
      cookieName: 'access_token', //  prod: "__Host-access_token"
      signed: false,
    },
    sign: {
      algorithm: 'HS256', // w prod: RS256 i rotacja
      iss: 'miglee-api',
      aud: 'miglee-web',
      expiresIn: '7d',
    },
    verify: {
      algorithms: ['HS256'],
      allowedIss: 'miglee-api',
      allowedAud: 'miglee-web',
      maxAge: '7d',
      clockTolerance: 5, // sekundy tolerancji zegara
    },
  });
});
