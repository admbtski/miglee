/**
 * Developer Logger - Enhanced logging for development
 * Provides structured, colorful, and filterable logs
 */

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';
type LogCategory =
  | 'query'
  | 'mutation'
  | 'subscription'
  | 'auth'
  | 'navigation'
  | 'api'
  | 'cache'
  | 'websocket'
  | 'general';

interface LogOptions {
  category?: LogCategory;
  data?: any;
  error?: Error | unknown;
  duration?: number;
  metadata?: Record<string, any>;
}

const isDev = process.env.NODE_ENV === 'development';
const isDebugEnabled =
  typeof window !== 'undefined' && localStorage.getItem('debug') === 'true';

// Color schemes for different log types
const colors = {
  info: '#3b82f6', // blue
  success: '#10b981', // green
  warning: '#f59e0b', // amber
  error: '#ef4444', // red
  debug: '#8b5cf6', // purple
};

const categoryEmojis: Record<LogCategory, string> = {
  query: '🔍',
  mutation: '✏️',
  subscription: '📡',
  auth: '🔐',
  navigation: '🧭',
  api: '🌐',
  cache: '💾',
  websocket: '🔌',
  general: '📝',
};

class DevLogger {
  private enabled: boolean;

  constructor() {
    this.enabled = isDev || isDebugEnabled;
  }

  private log(level: LogLevel, message: string, options: LogOptions = {}) {
    if (!this.enabled) return;

    const { category = 'general', data, error, duration, metadata } = options;
    const emoji = categoryEmojis[category];
    const color = colors[level];
    const timestamp = new Date().toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });

    // Main log message
    console.groupCollapsed(
      `%c${emoji} [${category.toUpperCase()}] %c${message} %c${timestamp}`,
      `color: ${color}; font-weight: bold;`,
      `color: ${color};`,
      'color: #94a3b8; font-size: 0.85em;'
    );

    // Log details
    if (data !== undefined) {
      console.log('%cData:', 'color: #06b6d4; font-weight: bold;', data);
    }

    if (error) {
      console.error('%cError:', 'color: #ef4444; font-weight: bold;', error);
      if (error instanceof Error) {
        console.error('Stack:', error.stack);
      }
    }

    if (duration !== undefined) {
      console.log(
        `%cDuration: ${duration}ms`,
        duration > 1000
          ? 'color: #f59e0b; font-weight: bold;'
          : 'color: #10b981; font-weight: bold;'
      );
    }

    if (metadata) {
      console.log(
        '%cMetadata:',
        'color: #8b5cf6; font-weight: bold;',
        metadata
      );
    }

    console.trace('Call stack');
    console.groupEnd();
  }

  // Public methods
  info(message: string, options?: LogOptions) {
    this.log('info', message, options);
  }

  success(message: string, options?: LogOptions) {
    this.log('success', message, options);
  }

  warning(message: string, options?: LogOptions) {
    this.log('warning', message, options);
  }

  error(message: string, options?: LogOptions) {
    this.log('error', message, options);
  }

  debug(message: string, options?: LogOptions) {
    if (!isDebugEnabled) return;
    this.log('debug', message, options);
  }

  // Specialized methods for React Query
  queryStart(queryKey: unknown[], options?: Omit<LogOptions, 'category'>) {
    this.info(`Query started: ${JSON.stringify(queryKey)}`, {
      ...options,
      category: 'query',
    });
  }

  querySuccess(queryKey: unknown[], data: any, duration?: number) {
    this.success(`Query success: ${JSON.stringify(queryKey)}`, {
      category: 'query',
      data,
      duration,
    });
  }

  queryError(queryKey: unknown[], error: unknown, duration?: number) {
    this.error(`Query failed: ${JSON.stringify(queryKey)}`, {
      category: 'query',
      error,
      duration,
    });
  }

  mutationStart(mutationKey: string, variables?: any) {
    this.info(`Mutation started: ${mutationKey}`, {
      category: 'mutation',
      data: variables,
    });
  }

  mutationSuccess(mutationKey: string, data: any, duration?: number) {
    this.success(`Mutation success: ${mutationKey}`, {
      category: 'mutation',
      data,
      duration,
    });
  }

  mutationError(
    mutationKey: string,
    error: unknown,
    variables?: any,
    duration?: number
  ) {
    this.error(`Mutation failed: ${mutationKey}`, {
      category: 'mutation',
      error,
      data: variables,
      duration,
    });
  }

  subscriptionConnected(topic: string) {
    this.success(`Subscription connected: ${topic}`, {
      category: 'subscription',
    });
  }

  subscriptionMessage(topic: string, data: any) {
    this.debug(`Subscription message: ${topic}`, {
      category: 'subscription',
      data,
    });
  }

  subscriptionError(topic: string, error: unknown) {
    this.error(`Subscription error: ${topic}`, {
      category: 'subscription',
      error,
    });
  }

  subscriptionDisconnected(topic: string) {
    this.warning(`Subscription disconnected: ${topic}`, {
      category: 'subscription',
    });
  }

  // Cache operations
  cacheInvalidated(queryKey: unknown[]) {
    this.info(`Cache invalidated: ${JSON.stringify(queryKey)}`, {
      category: 'cache',
    });
  }

  cacheUpdated(queryKey: unknown[], data: any) {
    this.debug(`Cache updated: ${JSON.stringify(queryKey)}`, {
      category: 'cache',
      data,
    });
  }

  // WebSocket
  wsConnected(url: string) {
    this.success(`WebSocket connected: ${url}`, {
      category: 'websocket',
    });
  }

  wsDisconnected(url: string, reason?: string) {
    this.warning(`WebSocket disconnected: ${url}`, {
      category: 'websocket',
      metadata: { reason },
    });
  }

  wsMessage(type: string, data: any) {
    this.debug(`WebSocket message: ${type}`, {
      category: 'websocket',
      data,
    });
  }

  wsError(error: unknown) {
    this.error('WebSocket error', {
      category: 'websocket',
      error,
    });
  }

  // Auth
  authLogin(userId: string) {
    this.success(`User logged in: ${userId}`, {
      category: 'auth',
    });
  }

  authLogout() {
    this.info('User logged out', {
      category: 'auth',
    });
  }

  authError(error: unknown) {
    this.error('Authentication error', {
      category: 'auth',
      error,
    });
  }

  // Performance
  performance(label: string, duration: number) {
    const level =
      duration > 1000 ? 'warning' : duration > 500 ? 'info' : 'success';
    this.log(level, `Performance: ${label}`, {
      category: 'general',
      duration,
    });
  }

  // Enable/disable logging
  enable() {
    this.enabled = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('debug', 'true');
    }
    console.log(
      '%c🐛 Debug mode enabled',
      'color: #10b981; font-weight: bold; font-size: 1.2em;'
    );
  }

  disable() {
    this.enabled = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('debug');
    }
    console.log(
      '%c🐛 Debug mode disabled',
      'color: #94a3b8; font-weight: bold; font-size: 1.2em;'
    );
  }
}

// Singleton instance
export const devLogger = new DevLogger();

// Global window access for easy debugging
if (typeof window !== 'undefined') {
  (window as any).devLogger = devLogger;
  (window as any).enableDebug = () => devLogger.enable();
  (window as any).disableDebug = () => devLogger.disable();
}
