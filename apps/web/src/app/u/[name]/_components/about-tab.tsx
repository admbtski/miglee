'use client';

import {
  Globe,
  Languages,
  Heart,
  Dumbbell,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Link2,
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
    color: 'text-pink-600 dark:text-pink-400',
    label: 'Instagram',
  },
  FACEBOOK: {
    icon: Facebook,
    color: 'text-blue-600 dark:text-blue-400',
    label: 'Facebook',
  },
  TWITTER: {
    icon: Twitter,
    color: 'text-sky-500 dark:text-sky-400',
    label: 'Twitter',
  },
  X: {
    icon: Twitter,
    color: 'text-zinc-900 dark:text-zinc-100',
    label: 'X',
  },
  STRAVA: {
    icon: Activity,
    color: 'text-orange-600 dark:text-orange-400',
    label: 'Strava',
  },
  DISCORD: {
    icon: MessageCircle,
    color: 'text-indigo-600 dark:text-indigo-400',
    label: 'Discord',
  },
  WEBSITE: {
    icon: Globe,
    color: 'text-zinc-600 dark:text-zinc-400',
    label: 'Website',
  },
};

const LEVEL_CONFIG = {
  BEGINNER: {
    label: 'Początkujący',
    color:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    emoji: '🌱',
  },
  INTERMEDIATE: {
    label: 'Średniozaawansowany',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    emoji: '⚡',
  },
  ADVANCED: {
    label: 'Zaawansowany',
    color:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    emoji: '🏆',
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
    <div className="space-y-4">
      {/* About Me */}
      {bioLong && (
        <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/50">
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            💬 O mnie
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {bioLong}
          </p>
        </div>
      )}

      {/* Languages */}
      {speaks.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Languages className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Języki
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {speaks.map((lang) => (
              <span
                key={lang}
                className="rounded-full bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 shadow-sm dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-300"
              >
                🌍 {lang.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {interests.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
              <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Zainteresowania
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-1.5 text-sm font-medium text-pink-700 shadow-sm dark:from-pink-900/30 dark:to-rose-900/30 dark:text-pink-300"
              >
                ✨ {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sports & Disciplines */}
      {disciplines.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Dumbbell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Dyscypliny sportowe
            </h2>
          </div>
          <div className="space-y-2">
            {disciplines.map((discipline) => {
              const levelConfig =
                LEVEL_CONFIG[discipline.level as keyof typeof LEVEL_CONFIG];
              const categoryName = getCategoryName(discipline.category);

              return (
                <div
                  key={discipline.id}
                  className="group rounded-lg border border-zinc-200 bg-gradient-to-r from-zinc-50 to-white p-4 transition-all hover:border-purple-300 hover:shadow-md dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/50 dark:hover:border-purple-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {categoryName}
                        </span>
                      </div>
                      {discipline.notes && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {discipline.notes}
                        </p>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${levelConfig.color}`}
                    >
                      {levelConfig.emoji} {levelConfig.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Link2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Social Media
            </h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
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
                  className="group flex items-center gap-3 rounded-lg border border-zinc-200 bg-gradient-to-r from-zinc-50 to-white p-3 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/50 dark:hover:border-zinc-700"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-zinc-800">
                    <Icon className={`h-5 w-5 ${config!.color}`} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {config!.label}
                    </span>
                    {link.verified && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        ✓ Zweryfikowany
                      </span>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
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
          <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 to-zinc-100 p-12 text-center dark:border-zinc-700 dark:from-zinc-900/50 dark:to-zinc-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
              <Heart className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Brak informacji
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Ten użytkownik nie dodał jeszcze żadnych informacji o sobie.
            </p>
          </div>
        )}
    </div>
  );
}
