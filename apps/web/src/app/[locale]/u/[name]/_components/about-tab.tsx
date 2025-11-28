'use client';

import {
  Globe,
  Heart,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Activity,
  ExternalLink,
} from 'lucide-react';
import type { GetUserProfileQuery } from '@/lib/api/__generated__/react-query-update';

type AboutTabProps = {
  user: NonNullable<GetUserProfileQuery['user']>;
};

const SOCIAL_CONFIG: Record<
  string,
  { icon: typeof Instagram; color: string; label: string }
> = {
  INSTAGRAM: {
    icon: Instagram,
    color: 'text-pink-600',
    label: 'Instagram',
  },
  FACEBOOK: {
    icon: Facebook,
    color: 'text-blue-600',
    label: 'Facebook',
  },
  TWITTER: {
    icon: Twitter,
    color: 'text-sky-500',
    label: 'Twitter',
  },
  X: {
    icon: Twitter,
    color: 'text-slate-900',
    label: 'X',
  },
  STRAVA: {
    icon: Activity,
    color: 'text-orange-600',
    label: 'Strava',
  },
  DISCORD: {
    icon: MessageCircle,
    color: 'text-indigo-600',
    label: 'Discord',
  },
  WEBSITE: {
    icon: Globe,
    color: 'text-slate-600',
    label: 'Website',
  },
};

const LEVEL_CONFIG = {
  BEGINNER: {
    label: 'Beginner',
    color: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300',
  },
  INTERMEDIATE: {
    label: 'Intermediate',
    color: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300',
  },
  ADVANCED: {
    label: 'Advanced',
    color: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300',
  },
};

export function AboutTab({ user }: AboutTabProps) {
  const bioLong = user.profile?.bioLong;
  const speaks = user.profile?.speaks ?? [];
  const interests = user.profile?.interests ?? [];
  const disciplines = user.disciplines ?? [];
  const socialLinks = user.socialLinks ?? [];

  const getCategoryName = (category: any) => {
    if (typeof category.names === 'object') {
      return category.names.en || category.names.pl || category.slug;
    }
    return category.slug;
  };

  return (
    <div className="space-y-6">
      {/* About Me */}
      {bioLong && (
        <div className="rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            About
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {bioLong}
          </p>
        </div>
      )}

      {/* Languages */}
      {speaks.length > 0 && (
        <div className="rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Languages
          </h2>
          <div className="flex flex-wrap gap-2">
            {speaks.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center rounded-full bg-slate-100 dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                {lang.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {interests.length > 0 && (
        <div className="rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Interests
          </h2>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center rounded-full bg-slate-100 dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sports & Disciplines */}
      {disciplines.length > 0 && (
        <div className="rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sports
          </h2>
          <div className="space-y-4">
            {disciplines.map((discipline) => {
              const levelConfig =
                LEVEL_CONFIG[discipline.level as keyof typeof LEVEL_CONFIG];
              const categoryName = getCategoryName(discipline.category);

              return (
                <div
                  key={discipline.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
                >
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {categoryName}
                      </span>
                    </div>
                    {discipline.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {discipline.notes}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${levelConfig.color}`}
                  >
                    {levelConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <div className="rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Social Media
          </h2>
          <div className="space-y-2">
            {socialLinks.map((link) => {
              const config =
                SOCIAL_CONFIG[link.provider.toUpperCase()] ??
                SOCIAL_CONFIG.WEBSITE;
              const Icon = config!.icon;

              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  <Icon className={`h-4 w-4 ${config!.color}`} />
                  <div className="flex-1">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {config!.label}
                    </span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400 dark:text-slate-600" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!bioLong &&
        speaks.length === 0 &&
        interests.length === 0 &&
        disciplines.length === 0 &&
        socialLinks.length === 0 && (
          <div className="rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800">
              <Heart className="h-8 w-8 text-slate-400 dark:text-slate-600" />
            </div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              No information yet
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This user hasn't added any information yet.
            </p>
          </div>
        )}
    </div>
  );
}
