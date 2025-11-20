'use client';

import { Award, Users, Calendar, Star } from 'lucide-react';
import type { GetUserProfileQuery } from '@/lib/api/__generated__/react-query-update';

type StatsTabProps = {
  user: NonNullable<GetUserProfileQuery['user']>;
};

export function StatsTab({ user }: StatsTabProps) {
  const stats = user.stats;

  if (!stats) {
    return (
      <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 to-zinc-100 p-12 text-center dark:border-zinc-700 dark:from-zinc-900/50 dark:to-zinc-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
          <Award className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
        </div>
        <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Brak statystyk
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ten użytkownik nie brał jeszcze udziału w żadnych wydarzeniach.
        </p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Utworzonych wydarzeń',
      value: stats.eventsCreated,
      icon: Calendar,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      darkBgGradient: 'dark:from-blue-900/30 dark:to-blue-800/30',
      emoji: '📅',
    },
    {
      label: 'Uczestnictw',
      value: stats.eventsJoined,
      icon: Users,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-100',
      darkBgGradient: 'dark:from-green-900/30 dark:to-emerald-800/30',
      emoji: '👥',
    },
    {
      label: 'Otrzymanych recenzji',
      value: stats.reviewsCount,
      icon: Award,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      darkBgGradient: 'dark:from-purple-900/30 dark:to-purple-800/30',
      emoji: '⭐',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`group relative overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br ${stat.bgGradient} ${stat.darkBgGradient} p-6 shadow-sm transition-all hover:shadow-lg dark:border-zinc-800`}
            >
              <div className="relative">
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-md`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-3xl opacity-50 transition-transform group-hover:scale-110">
                    {stat.emoji}
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ratings */}
      {(stats.hostRatingAvg !== null || stats.attendeeRatingAvg !== null) && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Oceny
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.hostRatingAvg !== null && (
              <div className="group rounded-xl border border-zinc-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-5 transition-all hover:shadow-md dark:border-zinc-800 dark:from-yellow-900/20 dark:to-orange-900/20">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Jako organizator
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                    {stats.hostRatingAvg?.toFixed(1) ?? '0.0'}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      / 5.0
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.round(stats.hostRatingAvg!)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-zinc-300 dark:text-zinc-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {stats.attendeeRatingAvg !== null && (
              <div className="group rounded-xl border border-zinc-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 transition-all hover:shadow-md dark:border-zinc-800 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">🙋</span>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Jako uczestnik
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                    {stats.attendeeRatingAvg?.toFixed(1) ?? '0.0'}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      / 5.0
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.round(stats.attendeeRatingAvg!)
                              ? 'fill-green-400 text-green-400'
                              : 'text-zinc-300 dark:text-zinc-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
