'use client';

// TODO i18n: All Polish strings need translation keys
// - Stat labels, section titles, empty state, rating labels

import { Award, Users, Calendar, Star, TrendingUp, Trophy } from 'lucide-react';
import type { GetUserProfileQuery } from '@/lib/api/__generated__/react-query-update';

type StatsTabProps = {
  user: NonNullable<GetUserProfileQuery['user']>;
};

export function StatsTab({ user }: StatsTabProps) {
  const stats = user.stats;

  if (!stats) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-12 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <TrendingUp
            className="h-10 w-10 text-zinc-400 dark:text-zinc-600"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Brak statystyk
        </h3>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
          Ten użytkownik nie ma jeszcze żadnych statystyk.
        </p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Utworzone wydarzenia',
      value: stats.eventsCreated,
      icon: Calendar,
      color:
        'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Uczestnictwa',
      value: stats.eventsJoined,
      icon: Users,
      color:
        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Otrzymane opinie',
      value: stats.reviewsCount,
      icon: Award,
      color:
        'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}
              >
                <Icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <div>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ratings */}
      {(stats.hostRatingAvg !== null || stats.attendeeRatingAvg !== null) && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Oceny
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.hostRatingAvg !== null && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-5">
                <p className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Jako organizator
                </p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {stats.hostRatingAvg?.toFixed(1) ?? '0.0'}
                  </span>
                  <span className="text-lg text-zinc-500 dark:text-zinc-400">
                    / 5.0
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(stats.hostRatingAvg!)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-200 dark:text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {stats.attendeeRatingAvg !== null && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-5">
                <p className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Jako uczestnik
                </p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {stats.attendeeRatingAvg?.toFixed(1) ?? '0.0'}
                  </span>
                  <span className="text-lg text-zinc-500 dark:text-zinc-400">
                    / 5.0
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(stats.attendeeRatingAvg!)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-200 dark:text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Achievement Placeholder - for future */}
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Trophy className="h-7 w-7 text-zinc-400 dark:text-zinc-600" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Osiągnięcia wkrótce
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Tutaj pojawią się odznaki i osiągnięcia użytkownika.
        </p>
      </div>
    </div>
  );
}
