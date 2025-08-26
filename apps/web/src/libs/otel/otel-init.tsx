'use client';

import { useEffect } from 'react';
import { initOtelWeb } from './otel.client';
import { trace } from '@opentelemetry/api';

export default function OtelInit() {
  useEffect(() => {
    initOtelWeb();

    // smoke span – jeden raz po starcie
    const tracer = trace.getTracer('web-smoke');
    const span = tracer.startSpan('web:smoke-init');
    span.setAttribute('env', process.env.NODE_ENV ?? 'dev');
    span.end();
  }, []);
  return null;
}
