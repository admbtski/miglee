// components/WebVitals.tsx
'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

function send(metric: Metric) {
  const payload = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navType: metric.navigationType,
    ts: Date.now(),
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
      metric
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
