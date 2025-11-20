// app/api/vitals/route.ts
import { NextResponse } from 'next/server';

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
};

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
        console.log('[api/vitals]', m.name, m.value, m.rating, m);
      }

      // PRZYKŁAD: forward do GA4 Measurement Protocol (opcjonalnie)
      // if (process.env.GA_MEASUREMENT_ID && process.env.GA_API_SECRET && shouldSample()) {
      //   await fetch(
      //     `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`,
      //     {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({
      //         client_id: 'webvitals.anonymous', // lub z cookie/_ga
      //         events: [
      //           {
      //             name: 'web_vital',
      //             params: { id: m.id, name: m.name, value: m.value, rating: m.rating, navType: m.navType },
      //           },
      //         ],
      //       }),
      //     }
      //   );
      // }

      // PRZYKŁAD: log do własnego backendu/DB/Sentry — wstaw tu swoją integrację.
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'bad payload' },
      { status: 400 }
    );
  }
}
