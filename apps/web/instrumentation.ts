/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically called by Next.js when the server starts.
 * It's the perfect place to initialize OpenTelemetry.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only initialize on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initObservability } = await import('@appname/observability');
    
    await initObservability({
      serviceName: process.env.OTEL_SERVICE_NAME || 'miglee-web',
      serviceVersion: process.env.BUILD_SHA || 'unknown',
      environment: process.env.NODE_ENV || 'development',
    });

    console.log('[Web] OpenTelemetry initialized');
  }

  // Browser-side initialization would go here if needed
  // For now, we only do manual tracing in the browser
}

