import pino from 'pino';
import { config, env } from '../env';

export const logger = pino({
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
