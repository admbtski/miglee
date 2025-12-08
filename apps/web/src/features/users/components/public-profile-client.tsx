'use client';

import { useState } from 'react';
import { User, Calendar, Star, Loader2, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProfileQuery } from '@/features/users/api/user-profile';
import { useMeQuery } from '@/features/auth/hooks/auth';
import { ProfileHeader } from './profile-header';
import { AboutTab } from './about-tab';
import { EventsTab } from './events-tab';
import { ReviewsTab } from './reviews-tab';
import { StatsTab } from './stats-tab';
import { cn } from '@/lib/utils';

type TabId = 'about' | 'events' | 'reviews' | 'stats';

interface TabConfig {
  id: TabId;
  label: string;
  icon: typeof User;
}

const TABS: TabConfig[] = [
  { id: 'about', label: 'O mnie', icon: User },
  { id: 'events', label: 'Wydarzenia', icon: Calendar },
  { id: 'reviews', label: 'Opinie', icon: Star },
  { id: 'stats', label: 'Statystyki', icon: BarChart3 },
];

type PublicProfileClientProps = {
  username: string;
};

export function PublicProfileClient({ username }: PublicProfileClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('about');

  const { data: authData } = useMeQuery();
  const currentUserId = authData?.me?.id;

  const { data, isLoading, error } = useUserProfileQuery({
    name: username,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 opacity-20 blur-xl animate-pulse" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-zinc-900 shadow-lg">
              <Loader2
                className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin"
                strokeWidth={2}
              />
            </div>
          </div>
          <p className="mt-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Ładowanie profilu...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <User
              className="h-10 w-10 text-zinc-400 dark:text-zinc-600"
              strokeWidth={1.5}
            />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Nie znaleziono użytkownika
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Użytkownik{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              @{username}
            </span>{' '}
            nie istnieje lub został usunięty.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Wróć do strony głównej
          </a>
        </div>
      </div>
    );
  }

  const user = data.user;
  const isOwnProfile = currentUserId === user.id;

  const tabCounts: Record<TabId, number | null> = {
    about: null,
    events: (user.stats?.eventsCreated ?? 0) + (user.stats?.eventsJoined ?? 0),
    reviews: user.stats?.reviewsCount ?? 0,
    stats: null,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} />

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex justify-center">
            <nav
              className="inline-flex items-center gap-1 rounded-2xl bg-white dark:bg-zinc-900 p-1.5 shadow-sm border border-zinc-200 dark:border-zinc-800"
              aria-label="Profile tabs"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                const count = tabCounts[tab.id];

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-zinc-900 text-white shadow-md dark:bg-white dark:text-zinc-900'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    <span>{tab.label}</span>

                    {/* Count Badge */}
                    {count !== null && count > 0 && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-colors',
                          isActive
                            ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        )}
                      >
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {activeTab === 'about' && <AboutTab user={user} />}
            {activeTab === 'events' && <EventsTab user={user} />}
            {activeTab === 'reviews' && <ReviewsTab user={user} />}
            {activeTab === 'stats' && <StatsTab user={user} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
