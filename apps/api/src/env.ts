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

  // Media Storage
  MEDIA_STORAGE_PROVIDER: z.enum(['LOCAL', 'S3']).default('LOCAL'),
  UPLOADS_PATH: z.string().default('./uploads'),
  UPLOADS_TMP_PATH: z.string().default('./tmp/uploads'),

  // Image Processing
  IMAGE_MAX_WIDTH: z.coerce.number().default(2560),
  IMAGE_MAX_HEIGHT: z.coerce.number().default(2560),
  IMAGE_FORMAT: z.enum(['webp', 'avif']).default('webp'),
  IMAGE_QUALITY: z.coerce.number().min(1).max(100).default(85),

  // S3 Configuration (optional, required if MEDIA_STORAGE_PROVIDER=S3)
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  // CDN/Assets URL
  ASSETS_BASE_URL: z.string().optional(), // e.g. http://localhost:4000 or https://cdn.example.com
  CDN_ENABLED: z.coerce.boolean().default(false),
  CDN_BASE_URL: z.string().optional(),

  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().optional(), // Required for production
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(), // Required for webhook signature verification

  // Stripe Price IDs (set these in your .env for your Stripe account)
  // User Plans
  STRIPE_PRICE_USER_PLUS_MONTHLY_SUB: z.string().optional(),
  STRIPE_PRICE_USER_PLUS_MONTHLY_ONEOFF: z.string().optional(),
  STRIPE_PRICE_USER_PLUS_YEARLY_ONEOFF: z.string().optional(),
  STRIPE_PRICE_USER_PRO_MONTHLY_SUB: z.string().optional(),
  STRIPE_PRICE_USER_PRO_MONTHLY_ONEOFF: z.string().optional(),
  STRIPE_PRICE_USER_PRO_YEARLY_ONEOFF: z.string().optional(),
  // Event Plans
  STRIPE_PRICE_EVENT_PLUS: z.string().optional(),
  STRIPE_PRICE_EVENT_PRO: z.string().optional(),

  // App URLs
  APP_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000'),
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

  // Media
  mediaStorageProvider: env.MEDIA_STORAGE_PROVIDER,
  uploadsPath: env.UPLOADS_PATH,
  uploadsTmpPath: env.UPLOADS_TMP_PATH,
  imageMaxWidth: env.IMAGE_MAX_WIDTH,
  imageMaxHeight: env.IMAGE_MAX_HEIGHT,
  imageFormat: env.IMAGE_FORMAT,
  imageQuality: env.IMAGE_QUALITY,

  // S3
  s3Endpoint: env.S3_ENDPOINT,
  s3Region: env.S3_REGION,
  s3Bucket: env.S3_BUCKET,
  s3AccessKeyId: env.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: env.S3_SECRET_ACCESS_KEY,

  // CDN
  assetsBaseUrl: env.ASSETS_BASE_URL,
  cdnEnabled: env.CDN_ENABLED,
  cdnBaseUrl: env.CDN_BASE_URL,

  // Stripe
  stripeSecretKey: env.STRIPE_SECRET_KEY,
  stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY,
  stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,

  // Stripe Price IDs
  stripePrices: {
    user: {
      plus: {
        monthlySub: env.STRIPE_PRICE_USER_PLUS_MONTHLY_SUB,
        monthlyOneOff: env.STRIPE_PRICE_USER_PLUS_MONTHLY_ONEOFF,
        yearlyOneOff: env.STRIPE_PRICE_USER_PLUS_YEARLY_ONEOFF,
      },
      pro: {
        monthlySub: env.STRIPE_PRICE_USER_PRO_MONTHLY_SUB,
        monthlyOneOff: env.STRIPE_PRICE_USER_PRO_MONTHLY_ONEOFF,
        yearlyOneOff: env.STRIPE_PRICE_USER_PRO_YEARLY_ONEOFF,
      },
    },
    event: {
      plus: env.STRIPE_PRICE_EVENT_PLUS,
      pro: env.STRIPE_PRICE_EVENT_PRO,
    },
  },

  // URLs
  appUrl: env.APP_URL,
  apiUrl: env.API_URL,
};
