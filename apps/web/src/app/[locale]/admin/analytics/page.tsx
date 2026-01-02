'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Star,
  MapPin,
  Package,
  Activity,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>(
    '30d'
  );

  // TODO: Replace with real data from API
  const stats = {
    totalUsers: 1234,
    activeUsers: 856,
    totalEvents: 342,
    upcomingEvents: 127,
    completedEvents: 198,
    averageRating: 4.6,
    totalReviews: 1891,
    categoryDistribution: [
      { category: 'Sport', count: 89, percentage: 26 },
      { category: 'Kultura', count: 67, percentage: 20 },
      { category: 'Edukacja', count: 54, percentage: 16 },
      { category: 'Technologia', count: 45, percentage: 13 },
      { category: 'Biznes', count: 38, percentage: 11 },
      { category: 'Inne', count: 49, percentage: 14 },
    ],
    meetingKindDistribution: [
      { kind: 'ONSITE', count: 187, percentage: 55 },
      { kind: 'ONLINE', count: 98, percentage: 29 },
      { kind: 'HYBRID', count: 57, percentage: 16 },
    ],
    topCities: [
      { city: 'Warszawa', count: 145 },
      { city: 'Kraków', count: 78 },
      { city: 'Wrocław', count: 52 },
      { city: 'Gdańsk', count: 41 },
      { city: 'Poznań', count: 26 },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Statystyki i Analityka
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Przegląd aktywności i trendów platformy
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {range === '7d'
                ? '7 dni'
                : range === '30d'
                  ? '30 dni'
                  : range === '90d'
                    ? '90 dni'
                    : '1 rok'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Użytkownicy
              </p>
              <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.totalUsers}
              </p>
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                +12% vs poprzedni okres
              </p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Wydarzenia
              </p>
              <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.totalEvents}
              </p>
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                +8% vs poprzedni okres
              </p>
            </div>
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
              <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Średnia ocena
              </p>
              <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.averageRating}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                z {stats.totalReviews} recenzji
              </p>
            </div>
            <div className="rounded-lg bg-amber-100 p-3 dark:bg-amber-900/30">
              <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Aktywni użytkownicy
              </p>
              <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.activeUsers}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
                wszystkich
              </p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
              <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Events Status Breakdown */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Status wydarzeń
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Nadchodzące
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.upcomingEvents}
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Zakończone
              </span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.completedEvents}
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                W trakcie
              </span>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalEvents -
                  stats.upcomingEvents -
                  stats.completedEvents}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Rozkład kategorii
            </h2>
          </div>
          <div className="space-y-3">
            {stats.categoryDistribution.map((item) => (
              <div key={item.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {item.category}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-400"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Typ spotkań
            </h2>
          </div>
          <div className="space-y-3">
            {stats.meetingKindDistribution.map((item) => (
              <div key={item.kind}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {item.kind === 'ONSITE'
                      ? 'Stacjonarne'
                      : item.kind === 'ONLINE'
                        ? 'Online'
                        : 'Hybrydowe'}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full bg-green-600 dark:bg-green-400"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Cities */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Top 5 miast
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-5">
          {stats.topCities.map((item, index) => (
            <div
              key={item.city}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {item.city}
                </span>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {item.count}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                wydarzeń
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Wykresy czasowe
        </h2>
        <div className="flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2 text-sm">
              Wykresy czasowe będą dostępne wkrótce
            </p>
            <p className="mt-1 text-xs">
              (Nowe użytkownicy, wydarzenia, aktywność itp.)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

