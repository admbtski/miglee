'use client';

/**
 * Global error page for Next.js
 * Catches errors in the root layout
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Application Error
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                A critical error occurred. Please refresh the page or contact
                support if the problem persists.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-red-900 dark:text-red-100 mb-2">
                  Error Details
                </summary>
                <pre className="text-xs text-red-800 dark:text-red-200 overflow-auto">
                  {error.message}
                  {error.digest && `\n\nDigest: ${error.digest}`}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium rounded-lg transition-colors"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
