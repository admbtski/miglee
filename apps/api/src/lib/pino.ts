import pino, {
  LoggerOptions,
  TransportSingleOptions,
  TransportMultiOptions,
} from 'pino';
import { pinoTraceMixin } from '@appname/observability/pino';
import { config } from '../env';

type BuildLoggerOpts = {
  /** Log level: debug | info | warn | error ... */
  level?: string;
  /** Service name to include in each log line */
  name?: string;
  /** A simple env switch to control transports/destinations */
  env?: 'development' | 'production' | 'test';
  /** Optional explicit log file path (production typically) */
  filePath?: string;
};

/**
 * Build a production-ready Pino logger instance.
 * - DEV: pretty console output (pino-pretty).
 * - PROD/TEST: pure JSON; optional async file destination.
 * - Safe redaction for sensitive fields.
 * - ISO timestamp for easy parsing.
 */
export function buildLogger({
  level = config.logLevel,
  name = config.serviceName,
  env = config.nodeEnv,
  filePath = config.logFilePath,
}: BuildLoggerOpts = {}): LoggerOptions {
  // Base options shared across all environments
  const baseOptions = {
    name,
    level,
    // Add trace context (trace_id, span_id) to every log
    mixin: pinoTraceMixin,
    // Hide sensitive data in logs
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'headers.authorization',
        'headers.cookie',
        '*.password',
        '*.token',
        // 'res.headers.set-cookie', // uncomment if you ever log response headers
      ],
      censor: '[REDACTED]',
    },
    // Extra metadata added to each log line
    base: {
      pid: process.pid,
      env,
      service: name,
    },
    // Compact, useful serializers for req/res
    serializers: {
      req(req: {
        id?: string;
        method?: string;
        url?: string;
        params?: Record<string, string>;
        query?: Record<string, string>;
        headers?: Record<string, string | string[] | undefined>;
      }) {
        return {
          id: req?.id,
          method: req?.method,
          url: req?.url,
          params: req?.params,
          query: req?.query,
          // Only keep the most useful and non-sensitive headers
          headers: {
            'user-agent': req?.headers?.['user-agent'],
            'x-forwarded-for': req?.headers?.['x-forwarded-for'],
          },
        };
      },
      res(res: { statusCode?: number }) {
        return { statusCode: res?.statusCode };
      },
      err: pino.stdSerializers.err,
    },
    // ISO timestamps are easy to parse in log pipelines
    timestamp: pino.stdTimeFunctions.isoTime,
  } satisfies LoggerOptions;

  // Development: pretty print + OTLP export
  if (config.isDevelopment) {
    // If OTLP endpoint is configured, use multi-transport (console + OTLP)
    if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      const transport = {
        targets: [
          // Pretty console output
          {
            target: 'pino-pretty',
            level: level,
            options: {
              colorize: true,
              translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
              singleLine: false,
              ignore: 'pid,hostname',
            },
          },
          // OpenTelemetry OTLP export
          {
            target: 'pino-opentelemetry-transport',
            level: level,
            options: {
              resourceAttributes: {
                'service.name': name,
                'service.version': '1.0.0',
                'deployment.environment': env,
              },
              logRecordProcessorOptions: [
                {
                  recordProcessorType: 'batch',
                  exporterOptions: {
                    protocol: 'http/json',
                    endpoint: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs`,
                  },
                },
              ],
            },
          },
        ],
      } satisfies TransportMultiOptions;

      return { ...baseOptions, transport };
    }

    // Fallback: only pretty console (no OTLP)
    const transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        singleLine: false,
        ignore: 'pid,hostname',
      },
    } satisfies TransportSingleOptions;

    return { ...baseOptions, transport };
  }

  // Production/Test: pure JSON; optionally configure for file output
  if (filePath) {
    return {
      ...baseOptions,
      // File transport uses pino.destination() separately
      transport: { target: 'pino/file', options: { destination: filePath } },
    };
  }
  return baseOptions;
}

/**
 * Shared logger instance for use outside Fastify context
 * (e.g., in services, utilities, workers)
 */
export const logger = pino(buildLogger());
