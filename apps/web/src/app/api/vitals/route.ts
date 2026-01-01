// app/api/vitals/route.ts
import { NextResponse } from 'next/server';
import { metrics } from '@opentelemetry/api';

export const dynamic = 'force-dynamic'; // brak cache po stronie Vercel/Edge

type VitalsPayload = {
  id: string;
  name: 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB';
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  navType?: string;
  ts?: number;
  traceId?: string;
  spanId?: string;
  route?: string;
  device?: string;
  connection?: string;
};

// Create meters for web vitals
const meter = metrics.getMeter('web-vitals');
const lcpHistogram = meter.createHistogram('web.vitals.lcp', {
  description: 'Largest Contentful Paint (ms)',
  unit: 'ms',
});
const clsHistogram = meter.createHistogram('web.vitals.cls', {
  description: 'Cumulative Layout Shift',
  unit: '1',
});
const inpHistogram = meter.createHistogram('web.vitals.inp', {
  description: 'Interaction to Next Paint (ms)',
  unit: 'ms',
});
const fcpHistogram = meter.createHistogram('web.vitals.fcp', {
  description: 'First Contentful Paint (ms)',
  unit: 'ms',
});
const ttfbHistogram = meter.createHistogram('web.vitals.ttfb', {
  description: 'Time to First Byte (ms)',
  unit: 'ms',
});

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VitalsPayload | VitalsPayload[];

    const items = Array.isArray(body) ? body : [body];

    // tu możesz zaimplementować sampling, np. 10%:
    // const shouldSample = () => Math.random() < 0.1;

    for (const m of items) {
      if (!m?.name || typeof m.value !== 'number') continue;
      
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[api/vitals]', m.name, m.value, m.rating, {
          route: m.route,
          device: m.device,
          connection: m.connection,
          traceId: m.traceId,
        });
      }

      // Record metric to OTel
      const attributes = {
        'web.vital.name': m.name,
        'web.vital.rating': m.rating || 'unknown',
        'web.vital.route': m.route || 'unknown',
        'web.vital.device': m.device || 'unknown',
        'web.vital.connection': m.connection || 'unknown',
        'web.vital.nav_type': m.navType || 'unknown',
      };

      switch (m.name) {
        case 'LCP':
          lcpHistogram.record(m.value, attributes);
          break;
        case 'CLS':
          clsHistogram.record(m.value, attributes);
          break;
        case 'INP':
          inpHistogram.record(m.value, attributes);
          break;
        case 'FCP':
          fcpHistogram.record(m.value, attributes);
          break;
        case 'TTFB':
          ttfbHistogram.record(m.value, attributes);
          break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'bad payload' },
      { status: 400 }
    );
  }
}
