import { Client, createClient } from 'graphql-ws';

let wsClient: Client | null = null;

const L = {
  debug: (...a: unknown[]) => console.debug('🐞 [WS]', ...a),
  info: (...a: unknown[]) => console.info('ℹ️ [WS]', ...a),
  warn: (...a: unknown[]) => console.warn('⚠️ [WS]', ...a),
  error: (...a: unknown[]) => console.error('❌ [WS]', ...a),
};

const maskToken = (t?: string | null) =>
  t ? `${t.slice(0, 3)}…${t.slice(-3)}` : undefined;

const fmtErr = (err: unknown) => {
  if (err instanceof Error)
    return { name: err.name, message: err.message, stack: err.stack };
  try {
    return JSON.parse(JSON.stringify(err));
  } catch {
    return String(err);
  }
};

export function createWsClient(): Client {
  return createClient({
    url: process.env.NEXT_PUBLIC_WS_URL!,
    connectionParams: async () => {
      const accessToken = localStorage.getItem('accessToken');
      const masked = maskToken(accessToken);

      L.info('Prepare connectionParams', {
        hasToken: Boolean(accessToken),
        token: masked,
      });

      return {
        headers: {
          Authorization: accessToken
            ? `Bearer ${accessToken}`
            : 'Authorization test',
        },
      };
    },
    lazy: true,
    retryAttempts: 5,
    retryWait: (attempt) =>
      new Promise((resolve) => {
        L.warn('Retry connect', {
          attempt,
          delayMs: Math.min(1000 * attempt, 30000),
        });
        setTimeout(resolve, Math.min(1000 * attempt, 30000));
      }),
    onNonLazyError: (error) => {
      L.error('GraphQL WebSocket non-lazy error:', {
        error,
      });
    },
    on: {
      connected: (socket, payload, wasRetry) => {
        L.info('Connected', { socket, payload, wasRetry });
      },
      error: (error) => {
        L.error('Error', { error });
        wsClient?.dispose();
        resetWsClient();
      },
      closed: (_event: unknown) => {
        const event = _event as CloseEvent;

        const CLOSE_REASON: Record<number, string> = {
          1000: 'Normal Closure',
          1006: 'Abnormal Closure',
          1011: 'Internal Error',
          1012: 'Service Restart',
          1013: 'Try Again Later',
          4400: 'Bad Request',
          4401: 'Unauthorized',
          4403: 'Forbidden',
          4408: 'Subprotocol Mismatch',
          4429: 'Too Many Requests',
        };

        const reason = CLOSE_REASON[event.code] ?? 'Unknown';
        L.warn('Closed', {
          code: event.code,
          reason,
          wasClean: event.wasClean,
          rawReason: event.reason,
        });
        wsClient = null;
      },
      message: (message) => {
        L.info('Next message', { message });
      },
      connecting: (connecting) => {
        L.info('Connecting', { connecting });
      },
    },
  });
}

export function getWsClient(): Client {
  if (!wsClient) {
    L.info('Init WS client (singleton)');
    wsClient = createWsClient();
  } else {
    L.debug('Reuse existing WS client');
  }
  return wsClient;
}

// Użyj po zmianie accessTokenu
export function resetWsClient(reconnect = true): void {
  if (wsClient) {
    L.info('Reset WS client: disposing current instance');
    try {
      wsClient.dispose();
    } catch (e) {
      L.error('Dispose error', fmtErr(e));
    }
    wsClient = null;
  }
  if (reconnect) {
    L.info('Reset WS client: re-create instance');
    wsClient = createWsClient();
  }
}
