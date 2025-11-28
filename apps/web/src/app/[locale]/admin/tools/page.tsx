'use client';

import { useState } from 'react';
import { RefreshCw, Database, Zap, Activity } from 'lucide-react';

export default function ToolsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleReindex = async (type: string) => {
    setLoading(type);
    // TODO: Implement actual reindexing logic
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Narzędzia operacyjne
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Narzędzia do zarządzania systemem i konserwacji
        </p>
      </div>

      {/* Reindexing */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Reindeksacja
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                Liczniki wydarzeń
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Przelicz joinedCount, commentsCount, reviewsCount
              </p>
            </div>
            <button
              onClick={() => handleReindex('intents')}
              disabled={loading === 'intents'}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === 'intents' ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Uruchom
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                Indeks wyszukiwania
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Odbuduj indeks full-text search
              </p>
            </div>
            <button
              onClick={() => handleReindex('search')}
              disabled={loading === 'search'}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === 'search' ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Uruchom
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Database maintenance */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Konserwacja bazy danych
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                Usuń osierocone dane
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Wyczyść dane bez powiązań (orphaned records)
              </p>
            </div>
            <button
              onClick={() => handleReindex('orphaned')}
              disabled={loading === 'orphaned'}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === 'orphaned' ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Uruchom
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                Vacuum bazy danych
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Optymalizacja i odzyskanie miejsca
              </p>
            </div>
            <button
              onClick={() => handleReindex('vacuum')}
              disabled={loading === 'vacuum'}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === 'vacuum' ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Uruchom
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Health checks */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Health Checks
          </h2>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Database
            </span>
            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
              OK
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Redis
            </span>
            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
              OK
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              GraphQL API
            </span>
            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
              OK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
