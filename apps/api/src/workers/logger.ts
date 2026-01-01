import pino from 'pino';
import { config, env } from '../env';
import { pinoTraceMixin } from '@appname/observability';

export const logger = pino({
  name: 'worker',
  mixin: pinoTraceMixin, // Add trace context to logs
  transport: config.isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
  level: env.LOG_LEVEL,
});
