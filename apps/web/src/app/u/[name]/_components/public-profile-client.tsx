'use client';

import { useState } from 'react';
import { User, Calendar, Star, Loader2, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProfileQuery } from '@/lib/api/user-profile';
import { useMeQuery } from '@/lib/api/auth';
import { ProfileHeader } from './profile-header';
import { AboutTab } from './about-tab';
import { EventsTab } from './events-tab';
import { ReviewsTab } from './reviews-tab';
import { StatsTab } from './stats-tab';

type TabId = 'about' | 'events' | 'reviews' | 'stats';

interface TabConfig {
  id: TabId;
  label: string;
  icon: typeof User;
  emoji: string;
}

const TABS: TabConfig[] = [
  { id: 'about', label: 'O mnie', icon: User, emoji: '👤' },
  { id: 'events', label: 'Wydarzenia', icon: Calendar, emoji: '📅' },
  { id: 'reviews', label: 'Recenzje', icon: Star, emoji: '⭐' },
  { id: 'stats', label: 'Statystyki', icon: BarChart3, emoji: '📊' },
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-zinc-400" />
          <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            User not found
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            The user @{username} doesn't exist or has been removed.
          </p>
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
    stats: 3,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} />

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <nav
            className="flex min-w-max gap-2 border-b border-zinc-200 dark:border-zinc-800"
            aria-label="Tabs"
          >
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const count = tabCounts[tab.id];

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ transitionDelay: `${index * 50}ms` }}
                  className={`group relative inline-flex items-center gap-2 border-b-2 px-4 py-3 text-base font-semibold transition-all duration-200 ${
                    isActive
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-zinc-600 hover:border-blue-300 hover:text-blue-600 dark:text-zinc-400 dark:hover:border-blue-700 dark:hover:text-blue-400'
                  }`}
                >
                  {/* Emoji */}
                  <span
                    className={`text-lg transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                  >
                    {tab.emoji}
                  </span>

                  {/* Label */}
                  <span>{tab.label}</span>

                  {/* Count Badge */}
                  {count !== null && count > 0 && (
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-zinc-100 text-zinc-600 group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
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
