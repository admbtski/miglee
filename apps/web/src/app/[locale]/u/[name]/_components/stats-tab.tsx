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
      <div className="rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800">
          <Award className="h-8 w-8 text-slate-400 dark:text-slate-600" />
        </div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          No stats yet
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This user hasn't participated in any events yet.
        </p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Events Created',
      value: stats.eventsCreated,
      icon: Calendar,
    },
    {
      label: 'Participations',
      value: stats.eventsJoined,
      icon: Users,
    },
    {
      label: 'Reviews Received',
      value: stats.reviewsCount,
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid - Clean professional cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800">
                <Icon
                  className="h-5 w-5 text-slate-600 dark:text-slate-400"
                  strokeWidth={2}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ratings */}
      {(stats.hostRatingAvg !== null || stats.attendeeRatingAvg !== null) && (
        <div className="rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Ratings
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.hostRatingAvg !== null && (
              <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  As Organizer
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.hostRatingAvg?.toFixed(1) ?? '0.0'}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-500">
                    / 5.0
                  </span>
                </div>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.round(stats.hostRatingAvg!)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300 dark:text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {stats.attendeeRatingAvg !== null && (
              <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  As Participant
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.attendeeRatingAvg?.toFixed(1) ?? '0.0'}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-500">
                    / 5.0
                  </span>
                </div>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.round(stats.attendeeRatingAvg!)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300 dark:text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
