import { z } from 'zod';
import dotenv from 'dotenv';

// load env config
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  SERVICE_NAME: z.string().default('app'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('localhost'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  CORS_ORIGINS: z
    .string()
    .default('*')
    .transform((val) => val.split(',').map((s) => s.trim())),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  LOG_FILE_PATH: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export const config = {
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',

  nodeEnv: env.NODE_ENV,

  serviceName: env.SERVICE_NAME,
  port: env.PORT,
  host: env.HOST,

  jwtSecret: env.JWT_SECRET,

  dbUrl: env.DATABASE_URL,

  corsOrigins: env.CORS_ORIGINS,

  logLevel: env.LOG_LEVEL,
  logFilePath: env.LOG_FILE_PATH,
};
