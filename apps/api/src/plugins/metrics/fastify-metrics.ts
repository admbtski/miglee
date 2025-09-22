import opentelemetry from '@opentelemetry/api';
import fastifyPlugin from 'fastify-plugin';

const meter = opentelemetry.metrics.getMeter('api');

export const fastifyMetrics = fastifyPlugin(async (fastify) => {
  const requestsTotal = meter.createCounter('http_server_requests_total', {
    description: 'Total HTTP requests',
  });

  const activeRequests = meter.createUpDownCounter('http_active_requests', {
    description: 'Concurrent HTTP requests',
  });

  const reqDuration = meter.createHistogram(
    'http_server_request_duration_seconds'
  );

  const rateLimited = meter.createCounter('http_429_rate_limited_total');

  const statusClass = (code: number) => `${Math.floor(code / 100)}xx`;

  // prosta normalizacja ścieżki
  const normalizeRoute = (rawUrl: string) => {
    const path = rawUrl.split('?')[0] || '/';
    // /users/123 → /users/:id
    let r = path.replace(/\b\d+\b/g, ':id');
    // UUID → :uuid
    r = r.replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      ':uuid'
    );
    // trailing slash
    if (r.length > 1 && r.endsWith('/')) r = r.slice(0, -1);
    return r;
  };

  // ignoruj szum (dostosuj pod siebie)
  const shouldIgnore = (url: string) =>
    url.startsWith('/_next/') ||
    url.startsWith('/assets/') ||
    url.startsWith('/static/') ||
    url.startsWith('/__nextjs_source-map') ||
    url === '/favicon.ico' ||
    url === '/health';

  fastify.addHook('onRequest', async (req) => {
    if (shouldIgnore(req.url)) return;
    const route = normalizeRoute(
      (req.routeOptions?.url || req.url || req.raw.url || 'unknown') as string
    );
    req.__metrics = {
      start: process.hrtime.bigint(),
      route,
      counted: true,
    };
    activeRequests.add(1, { route });
  });

  fastify.addHook('onResponse', async (req, reply) => {
    const m = req.__metrics;
    if (!m) return;
    const end = process.hrtime.bigint();
    const durS = Number(end - m.start) / 1e9;
    const method = req.method;
    const sc = statusClass(reply.statusCode);
    const route = m.route;

    if (m.counted) activeRequests.add(-1, { route });
    requestsTotal.add(1, { method, route, status_class: sc });
    reqDuration.record(durS, { method, route, status_class: sc });

    if (reply.statusCode === 429) {
      rateLimited.add(1, { route });
    }
  });

  fastify.addHook('onError', async (req) => {
    const m = req.__metrics;
    if (m?.counted) {
      activeRequests.add(-1, { route: m.route });
      m.counted = false;
    }
  });
});

// 1) RPS (requests per second)
// sum(rate(http_server_requests_total[5m]))
// Per metoda/route:
// sum(rate(http_server_requests_total[5m])) by (method, route)

// 2) Error-rate (np. 5xx oraz 4xx)
// # 5xx
// sum(rate(http_server_requests_total{status_class="5xx"}[5m]))
// /
// sum(rate(http_server_requests_total[5m]))

// # 4xx
// sum(rate(http_server_requests_total{status_class="4xx"}[5m]))
// /
// sum(rate(http_server_requests_total[5m]))

// 3) Sukces-rate (2xx) – SLI dostępności
// sum(rate(http_server_requests_total{status_class="2xx"}[5m]))
// /
// sum(rate(http_server_requests_total[5m]))

// 4) Top „ciężkie” endpointy (po ruchu)
// topk(10, sum(rate(http_server_requests_total[5m])) by (route))

// 5) Traffic split per metoda
// sum(rate(http_server_requests_total[5m])) by (method)

// 6) 429 (rate limiting) – jeśli masz licznik http_429_rate_limited_total
// sum(rate(http_429_rate_limited_total[5m])) by (route)

// 7) Wzrost ruchu (porównanie do poprzedniego okna)
// sum(rate(http_server_requests_total[5m]))
// -
// sum(rate(http_server_requests_total[5m] offset 5m))
