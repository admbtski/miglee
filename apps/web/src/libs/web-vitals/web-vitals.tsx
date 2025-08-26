// components/WebVitals.tsx
'use client';

import { trace } from '@opentelemetry/api';
import { useEffect } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

function send(metric: Metric) {
  const span = trace.getActiveSpan();
  const traceId = span?.spanContext().traceId;

  const payload = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navType: metric.navigationType,
    ts: Date.now(),
    traceId,
  });

  const url = '/api/vitals';

  if ('sendBeacon' in navigator) {
    navigator.sendBeacon(url, payload);
  } else {
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: payload,
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(
      '[web-vitals]',
      metric.name,
      metric.value,
      metric.rating,
      metric,
      traceId
    );
  }
}

export function WebVitals() {
  useEffect(() => {
    onCLS(send);
    onLCP(send);
    onINP(send);
    onFCP(send);
    onTTFB(send);
  }, []);

  return null;
}
