import MQEmitterRedis from 'mqemitter-redis';
import IORedis from 'ioredis';

export const redisEmitter = MQEmitterRedis({
  host: process.env.REDIS_HOST ?? 'redis',
  port: Number(process.env.REDIS_PORT ?? 6379),
  //  password: process.env.REDIS_PASSWORD,

  retryStrategy: (times: number) => Math.min(500 + times * 250, 5000),
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  connectTimeout: 5_000,
  lazyConnect: false,
  keepAlive: 10_000,

  // tls: {}                       // if rediss://
});

redisEmitter.on('connect', () => console.info('[redis-emitter] connect'));
redisEmitter.on('ready', () => console.info('[redis-emitter] ready'));
redisEmitter.on('reconnecting', () =>
  console.warn('[redis-emitter] reconnecting')
);
redisEmitter.on('end', () => console.warn('[redis-emitter] end'));
redisEmitter.on('error', (err) => console.error('[redis-emitter] error', err));

export const healthRedis = new IORedis({
  host: process.env.REDIS_HOST ?? 'redis',
  port: Number(process.env.REDIS_PORT ?? 6379),
  //  password: process.env.REDIS_PASSWORD,

  retryStrategy: (times: number) => Math.min(500 + times * 250, 5000),
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  connectTimeout: 5_000,
  lazyConnect: false,
  keepAlive: 10_000,

  // tls: {}                       // if rediss://
});

export function closeRedisEmitter() {
  return new Promise<void>((resolve) => {
    // mqemitter-redis ma .close(cb)
    redisEmitter.close?.(() => resolve());
    healthRedis.disconnect();
  });
}

process.on('SIGTERM', async () => {
  console.info('SIGTERM: closing redis emitter…');
  await closeRedisEmitter();
  process.exit(0);
});
process.on('SIGINT', async () => {
  console.info('SIGINT: closing redis emitter…');
  await closeRedisEmitter();
  process.exit(0);
});
