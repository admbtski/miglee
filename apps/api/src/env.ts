import * as v from 'valibot';
import dotenv from 'dotenv';

// load env config
dotenv.config();

// Helper for boolean env vars (handles "true"/"false" strings correctly)
const booleanString = (defaultValue: boolean = false) =>
  v.pipe(
    v.optional(v.string(), defaultValue ? 'true' : 'false'),
    v.transform((val) => val === 'true' || val === '1')
  );

const envSchema = v.pipe(
  v.object({
    NODE_ENV: v.optional(
      v.picklist(['development', 'production', 'test']),
      'development'
    ),

    SERVICE_NAME: v.optional(v.string(), 'app'),
    PORT: v.pipe(
      v.optional(v.string(), '4000'),
      v.transform((val) => Number(val))
    ),
    HOST: v.optional(v.string(), 'localhost'),

    JWT_SECRET: v.pipe(
      v.string('JWT_SECRET is required'),
      v.minLength(32, 'JWT_SECRET must be at least 32 characters')
    ),

    DATABASE_URL: v.pipe(
      v.string('DATABASE_URL is required'),
      v.minLength(1, 'DATABASE_URL is required')
    ),

    CORS_ORIGINS: v.pipe(
      v.optional(v.string(), '*'),
      v.transform((val) => val.split(',').map((s) => s.trim()))
    ),

    LOG_LEVEL: v.optional(
      v.picklist(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
      'info'
    ),
    LOG_FILE_PATH: v.optional(v.string()),

    // Redis Configuration
    REDIS_HOST: v.optional(v.string(), 'redis'),
    REDIS_PORT: v.pipe(
      v.optional(v.string(), '6379'),
      v.transform((val) => Number(val))
    ),
    REDIS_PASSWORD: v.optional(v.string()),
    REDIS_DB: v.pipe(
      v.optional(v.string(), '0'),
      v.transform((val) => Number(val))
    ),
    REDIS_TLS: booleanString(false),

    // Media Storage
    MEDIA_STORAGE_PROVIDER: v.optional(
      v.picklist(['LOCAL', 'S3']),
      'LOCAL'
    ),
    UPLOADS_PATH: v.optional(v.string(), './uploads'),
    UPLOADS_TMP_PATH: v.optional(v.string(), './tmp/uploads'),

    // Audit Archive Storage (uses MEDIA_STORAGE_PROVIDER by default)
    AUDIT_ARCHIVE_PATH: v.optional(v.string(), './data/audit-archives'),

    // Image Processing
    IMAGE_MAX_WIDTH: v.pipe(
      v.optional(v.string(), '2560'),
      v.transform((val) => Number(val))
    ),
    IMAGE_MAX_HEIGHT: v.pipe(
      v.optional(v.string(), '2560'),
      v.transform((val) => Number(val))
    ),
    IMAGE_FORMAT: v.optional(v.picklist(['webp', 'avif']), 'webp'),
    IMAGE_QUALITY: v.pipe(
      v.optional(v.string(), '85'),
      v.transform((val) => Math.max(1, Math.min(100, Number(val))))
    ),

    // S3 Configuration (optional, required if MEDIA_STORAGE_PROVIDER=S3)
    S3_ENDPOINT: v.optional(v.string()),
    S3_REGION: v.optional(v.string()),
    S3_BUCKET: v.optional(v.string()),
    S3_ACCESS_KEY_ID: v.optional(v.string()),
    S3_SECRET_ACCESS_KEY: v.optional(v.string()),

    // CDN/Assets URL
    ASSETS_BASE_URL: v.optional(v.string()), // e.g. http://localhost:4000 or https://cdn.example.com
    CDN_ENABLED: booleanString(false),
    CDN_BASE_URL: v.optional(v.string()),

    // Stripe Configuration (required in production)
    STRIPE_SECRET_KEY: v.optional(v.string()),
    STRIPE_PUBLISHABLE_KEY: v.optional(v.string()),
    STRIPE_WEBHOOK_SECRET: v.optional(v.string()),

    // Stripe Price IDs (set these in your .env for your Stripe account)
    // User Plans
    STRIPE_PRICE_USER_PLUS_MONTHLY_SUB: v.optional(v.string()),
    STRIPE_PRICE_USER_PLUS_MONTHLY_ONEOFF: v.optional(v.string()),
    STRIPE_PRICE_USER_PLUS_YEARLY_ONEOFF: v.optional(v.string()),
    STRIPE_PRICE_USER_PRO_MONTHLY_SUB: v.optional(v.string()),
    STRIPE_PRICE_USER_PRO_MONTHLY_ONEOFF: v.optional(v.string()),
    STRIPE_PRICE_USER_PRO_YEARLY_ONEOFF: v.optional(v.string()),
    // Event Plans
    STRIPE_PRICE_EVENT_PLUS: v.optional(v.string()),
    STRIPE_PRICE_EVENT_PRO: v.optional(v.string()),
    // Action Packages (reload/top-up)
    STRIPE_PRICE_ACTION_PACKAGE_SMALL: v.optional(v.string()),
    STRIPE_PRICE_ACTION_PACKAGE_MEDIUM: v.optional(v.string()),
    STRIPE_PRICE_ACTION_PACKAGE_LARGE: v.optional(v.string()),

    // App URLs
    APP_URL: v.optional(v.string(), 'http://localhost:3000'),
    API_URL: v.optional(v.string(), 'http://localhost:4000'),

    // Email Configuration
    RESEND_API_KEY: v.optional(v.string()),
    EMAIL_FROM: v.optional(v.string(), 'Appname <noreply@appname.pl>'),

    // Admin Features
    ENABLE_BULL_BOARD: booleanString(false),
  }),
  // Stripe validation for production
  v.check((data) => {
    if (data.NODE_ENV === 'production') {
      const hasStripePrices =
        data.STRIPE_PRICE_USER_PLUS_MONTHLY_SUB ||
        data.STRIPE_PRICE_USER_PRO_MONTHLY_SUB ||
        data.STRIPE_PRICE_EVENT_PLUS ||
        data.STRIPE_PRICE_EVENT_PRO;

      if (hasStripePrices) {
        return !!data.STRIPE_SECRET_KEY && !!data.STRIPE_WEBHOOK_SECRET;
      }
    }
    return true;
  }, 'STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required in production when billing is configured'),
  // S3 validation for production
  v.check((data) => {
    if (
      data.NODE_ENV === 'production' &&
      data.MEDIA_STORAGE_PROVIDER === 'S3'
    ) {
      return (
        !!data.S3_BUCKET &&
        !!data.S3_REGION &&
        !!data.S3_ACCESS_KEY_ID &&
        !!data.S3_SECRET_ACCESS_KEY
      );
    }
    return true;
  }, 'S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY are required when MEDIA_STORAGE_PROVIDER=S3 in production')
);

export const env = v.parse(envSchema, process.env);

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

  // Redis
  redisHost: env.REDIS_HOST,
  redisPort: env.REDIS_PORT,
  redisPassword: env.REDIS_PASSWORD,
  redisDb: env.REDIS_DB,
  redisTls: env.REDIS_TLS,

  // Media
  mediaStorageProvider: env.MEDIA_STORAGE_PROVIDER,
  uploadsPath: env.UPLOADS_PATH,
  uploadsTmpPath: env.UPLOADS_TMP_PATH,
  imageMaxWidth: env.IMAGE_MAX_WIDTH,
  imageMaxHeight: env.IMAGE_MAX_HEIGHT,
  imageFormat: env.IMAGE_FORMAT,
  imageQuality: env.IMAGE_QUALITY,

  // Audit Archive
  auditArchivePath: env.AUDIT_ARCHIVE_PATH,

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
    actionPackages: {
      small: env.STRIPE_PRICE_ACTION_PACKAGE_SMALL,
      medium: env.STRIPE_PRICE_ACTION_PACKAGE_MEDIUM,
      large: env.STRIPE_PRICE_ACTION_PACKAGE_LARGE,
    },
  },

  // URLs
  appUrl: env.APP_URL,
  apiUrl: env.API_URL,

  // Email
  resendApiKey: env.RESEND_API_KEY,
  emailFrom: env.EMAIL_FROM,

  // Admin
  enableBullBoard: env.ENABLE_BULL_BOARD,
};
