/**
 * Test Error Boundary Integration
 * 
 * This page tests failed route transition tracking.
 * Navigate to this page from another route to simulate a failed transition.
 * 
 * Usage:
 * 1. Start app: pnpm dev:web:obs
 * 2. Open: http://localhost:3000
 * 3. Click a link to navigate to /test-error-boundary
 * 4. Error should be caught by Error Boundary
 * 5. Check Grafana Route Transitions dashboard for failed transition
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ErrorType = 'render' | 'useEffect' | 'event' | 'async' | 'none';

export default function TestErrorBoundaryPage() {
  const router = useRouter();
  const [errorType, setErrorType] = useState<ErrorType>('none');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Simulate error in useEffect (after render)
  useEffect(() => {
    if (errorType === 'useEffect' && countdown === 0) {
      throw new Error('TEST: useEffect error during route transition');
    }
  }, [errorType, countdown]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null || countdown === 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Simulate render error
  if (errorType === 'render' && countdown === 0) {
    throw new Error('TEST: Render error during route transition');
  }

  // Simulate event handler error
  const handleEventError = () => {
    throw new Error('TEST: Event handler error');
  };

  // Simulate async error
  const handleAsyncError = async () => {
    setCountdown(3);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    throw new Error('TEST: Async error during route transition');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
            🛡️ Error Boundary Test Page
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Test failed route transition tracking by triggering controlled errors.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-100 mb-3">
            📋 How to Test
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-yellow-900 dark:text-yellow-100">
            <li>
              <strong>Navigate to this page</strong> from another route (e.g., click a
              link from home page)
            </li>
            <li>
              <strong>Choose an error type</strong> below and click "Trigger Error"
            </li>
            <li>
              <strong>Error Boundary</strong> will catch the error and show fallback UI
            </li>
            <li>
              <strong>Failed transition</strong> will be reported to{' '}
              <code className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">
                /api/telemetry/web
              </code>
            </li>
            <li>
              <strong>Check Grafana</strong> Route Transitions dashboard for the failed
              transition
            </li>
          </ol>
        </div>

        {/* Error Type Selection */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Select Error Type
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Render Error */}
            <div className="border-2 border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                1. Render Error
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                Throws error during component render phase. Most common type.
              </p>
              <button
                onClick={() => {
                  setErrorType('render');
                  setCountdown(3);
                }}
                disabled={countdown !== null}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-300 dark:disabled:bg-red-900 text-white font-medium rounded-lg transition-colors"
              >
                {countdown !== null && errorType === 'render'
                  ? `Error in ${countdown}...`
                  : 'Trigger Render Error'}
              </button>
            </div>

            {/* useEffect Error */}
            <div className="border-2 border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                2. useEffect Error
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                Throws error in useEffect (after initial render). Simulates data
                fetching error.
              </p>
              <button
                onClick={() => {
                  setErrorType('useEffect');
                  setCountdown(3);
                }}
                disabled={countdown !== null}
                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-300 dark:disabled:bg-orange-900 text-white font-medium rounded-lg transition-colors"
              >
                {countdown !== null && errorType === 'useEffect'
                  ? `Error in ${countdown}...`
                  : 'Trigger useEffect Error'}
              </button>
            </div>

            {/* Event Handler Error */}
            <div className="border-2 border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                3. Event Handler Error
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                Throws error in event handler. Error Boundary will catch it.
              </p>
              <button
                onClick={handleEventError}
                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded-lg transition-colors"
              >
                Trigger Event Error (Instant)
              </button>
            </div>

            {/* Async Error */}
            <div className="border-2 border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                4. Async Error
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                Throws error in async function. Simulates API call failure.
              </p>
              <button
                onClick={handleAsyncError}
                disabled={countdown !== null}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-300 dark:disabled:bg-purple-900 text-white font-medium rounded-lg transition-colors"
              >
                {countdown !== null && errorType === 'async'
                  ? `Error in ${countdown}...`
                  : 'Trigger Async Error'}
              </button>
            </div>
          </div>
        </div>

        {/* Verification Steps */}
        <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-green-900 dark:text-green-100 mb-3">
            ✅ Verification Steps
          </h2>
          <div className="space-y-3 text-green-900 dark:text-green-100">
            <div>
              <strong>1. Check Browser Console:</strong>
              <pre className="mt-1 bg-green-100 dark:bg-green-900/30 p-2 rounded text-xs overflow-auto">
                [runtime-error] {'{'}type: "Error", message: "...", route:
                "/test-error-boundary"{'}'}
              </pre>
            </div>
            <div>
              <strong>2. Check Network Tab:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                <li>
                  Look for POST to{' '}
                  <code className="bg-green-200 dark:bg-green-900 px-1 rounded">
                    /api/telemetry/web
                  </code>
                </li>
                <li>Payload should contain failed transition data</li>
              </ul>
            </div>
            <div>
              <strong>3. Check Prometheus (wait 30s):</strong>
              <pre className="mt-1 bg-green-100 dark:bg-green-900/30 p-2 rounded text-xs overflow-auto">
                {
                  'curl http://localhost:9090/api/v1/query?query=web_route_transition_total{route_success="false"}'
                }
              </pre>
            </div>
            <div>
              <strong>4. Check Grafana Dashboard:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                <li>
                  Open:{' '}
                  <a
                    href="http://localhost:3001/d/route-transitions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 dark:text-green-300 hover:underline"
                  >
                    Route Transitions Dashboard
                  </a>
                </li>
                <li>Panel: "Error Rate by Route Group" should show spike</li>
                <li>Panel: "Overall Error Rate" should increase</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            🔗 Navigation
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
            >
              ← Go Home
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-zinc-600 hover:bg-zinc-500 text-white font-medium rounded-lg transition-colors"
            >
              ← Go Back
            </button>
            <a
              href="http://localhost:3001/d/route-transitions"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors inline-block"
            >
              📊 Open Grafana Dashboard
            </a>
          </div>
        </div>

        {/* Current State */}
        {countdown !== null && (
          <div className="mt-6 bg-red-100 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
              Error in {countdown}...
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Error type: {errorType}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

