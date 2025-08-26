import { FastifyLoggerOptions, RawServerBase } from 'fastify';
import { PinoLoggerOptions } from 'fastify/types/logger';
import pino, { LoggerOptions, TransportSingleOptions } from 'pino';
import { config } from '../env';
import { context, trace } from '@opentelemetry/api';

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
}: BuildLoggerOpts = {}): FastifyLoggerOptions<RawServerBase> &
  PinoLoggerOptions {
  // Base options shared across all environments
  const baseOptions = {
    mixin() {
      const span = trace.getSpan(context.active());
      const traceId = span?.spanContext().traceId;
      return traceId ? { traceId } : {};
    },
    name,
    level,
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
      req(req: any) {
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
      res(res: any) {
        return { statusCode: res?.statusCode };
      },
      err: pino.stdSerializers.err,
    },
    // ISO timestamps are easy to parse in log pipelines
    timestamp: pino.stdTimeFunctions.isoTime,
  } satisfies LoggerOptions;

  // Development: pretty print to console via transport
  if (config.isDevelopment) {
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

  // Production/Test: pure JSON; optionally write to file (async for performance)
  return filePath ? { ...baseOptions, file: filePath } : baseOptions;
}
