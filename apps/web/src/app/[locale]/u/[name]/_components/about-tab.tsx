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
  Languages,
  Sparkles,
  Dumbbell,
} from 'lucide-react';
import type { GetUserProfileQuery } from '@/lib/api/__generated__/react-query-update';

type AboutTabProps = {
  user: NonNullable<GetUserProfileQuery['user']>;
};

const SOCIAL_CONFIG: Record<
  string,
  { icon: typeof Instagram; color: string; bgColor: string; label: string }
> = {
  INSTAGRAM: {
    icon: Instagram,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    label: 'Instagram',
  },
  FACEBOOK: {
    icon: Facebook,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    label: 'Facebook',
  },
  TWITTER: {
    icon: Twitter,
    color: 'text-sky-500 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-900/20',
    label: 'Twitter',
  },
  X: {
    icon: Twitter,
    color: 'text-zinc-900 dark:text-zinc-100',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800',
    label: 'X',
  },
  STRAVA: {
    icon: Activity,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    label: 'Strava',
  },
  DISCORD: {
    icon: MessageCircle,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    label: 'Discord',
  },
  WEBSITE: {
    icon: Globe,
    color: 'text-zinc-600 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800',
    label: 'Strona WWW',
  },
};

const LEVEL_CONFIG = {
  BEGINNER: {
    label: 'Początkujący',
    color:
      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  },
  INTERMEDIATE: {
    label: 'Średniozaawansowany',
    color:
      'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  },
  ADVANCED: {
    label: 'Zaawansowany',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
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
      return category.names.pl || category.names.en || category.slug;
    }
    return category.slug;
  };

  const hasContent =
    bioLong ||
    speaks.length > 0 ||
    interests.length > 0 ||
    disciplines.length > 0 ||
    socialLinks.length > 0;

  return (
    <div className="space-y-6">
      {/* About Me */}
      {bioLong && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <Heart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              O mnie
            </h2>
          </div>
          <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {bioLong}
          </p>
        </div>
      )}

      {/* Languages */}
      {speaks.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Languages className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Języki
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {speaks.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center rounded-xl bg-violet-50 dark:bg-violet-900/20 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-300"
              >
                {lang.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {interests.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Zainteresowania
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sports & Disciplines */}
      {disciplines.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Dumbbell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Sporty i dyscypliny
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {disciplines.map((discipline) => {
              const levelConfig =
                LEVEL_CONFIG[discipline.level as keyof typeof LEVEL_CONFIG];
              const categoryName = getCategoryName(discipline.category);

              return (
                <div
                  key={discipline.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {categoryName}
                    </span>
                    {discipline.notes && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                        {discipline.notes}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-lg px-3 py-1 text-xs font-semibold ${levelConfig.color}`}
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
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Social Media
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
                  className="group flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${config!.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${config!.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {config!.label}
                    </span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasContent && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-12 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Heart
              className="h-10 w-10 text-zinc-400 dark:text-zinc-600"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Brak informacji
          </h3>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
            Ten użytkownik nie dodał jeszcze żadnych informacji o sobie.
          </p>
        </div>
      )}
    </div>
  );
}
