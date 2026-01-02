'use client';

import { format, pl } from '@/lib/date';
import { useState } from 'react';
import { Shield, AlertTriangle, Lock, Activity, Search } from 'lucide-react';

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<'blocks' | 'audit' | 'activity'>(
    'blocks'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: Replace with real data from API
  const stats = {
    totalBlocks: 12,
    recentBlocks: 3,
    auditEvents: 1234,
    suspendedUsers: 5,
  };

  const blocks = [
    {
      id: '1',
      blocker: { id: '1', name: 'John Doe', email: 'john@example.com' },
      blocked: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      createdAt: new Date().toISOString(),
    },
  ];

  const auditLogs = [
    {
      id: '1',
      action: 'USER_SUSPENDED',
      userId: '1',
      userName: 'Test User',
      actorId: '2',
      actorName: 'Admin',
      timestamp: new Date().toISOString(),
      details: 'Spam behavior detected',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Bezpieczeństwo i Audyt
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Monitorowanie bezpieczeństwa platformy i logi audytu
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
              <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Aktywne blokady
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.totalBlocks}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Zawieszeni użytkownicy
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.suspendedUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Zdarzenia audytu (30d)
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.auditEvents}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Nowe blokady (7d)
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.recentBlocks}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex">
            <button
              onClick={() => setActiveTab('blocks')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'blocks'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Blokady użytkowników
              </div>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'audit'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Logi audytu
              </div>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Podejrzana aktywność
              </div>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj..."
              className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'blocks' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Aktywne blokady ({blocks.length})
                </h3>
              </div>

              {blocks.length === 0 ? (
                <div className="py-12 text-center">
                  <Lock className="mx-auto h-12 w-12 text-zinc-400" />
                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Brak aktywnych blokad
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {block.blocker.name} zablokował(a){' '}
                            {block.blocked.name}
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {format(
                              new Date(block.createdAt),
                              'dd MMM yyyy, HH:mm',
                              { locale: pl }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Historia zdarzeń audytu
                </h3>
              </div>

              {auditLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <Activity className="mx-auto h-12 w-12 text-zinc-400" />
                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Brak zdarzeń audytu
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                    >
                      <div className="flex items-start gap-3">
                        <Activity className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {log.action}
                          </p>
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            Actor: {log.actorName} → Target: {log.userName}
                          </p>
                          {log.details && (
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                              {log.details}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                            {format(
                              new Date(log.timestamp),
                              'dd MMM yyyy, HH:mm:ss',
                              { locale: pl }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="py-12 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-zinc-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                System wykrywania podejrzanej aktywności będzie dostępny wkrótce
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                (Wielokrotne logowania, spam, abuse itp.)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

