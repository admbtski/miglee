'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import {
  getCurrentTraceId,
  getCurrentSpanId,
  getDeviceType,
  getCurrentRoute,
  getConnectionType,
  getRenderType,
} from '@appname/observability/browser';

function send(metric: Metric) {
  const traceId = getCurrentTraceId();
  const spanId = getCurrentSpanId();
  const route = getCurrentRoute();
  const device = getDeviceType();
  const connection = getConnectionType();
  const renderType = getRenderType();

  const payload = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navType: metric.navigationType,
    ts: Date.now(),
    // Enhanced attributes for better correlation and analysis
    traceId,
    spanId,
    route,
    device,
    connection,
    renderType,
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
      { route, device, connection, traceId },
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
