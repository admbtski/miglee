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
import { cn } from '@/lib/utils';

type TabId = 'about' | 'events' | 'reviews' | 'stats';

interface TabConfig {
  id: TabId;
  label: string;
  icon: typeof User;
}

const TABS: TabConfig[] = [
  { id: 'about', label: 'About', icon: User },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2
            className="w-8 h-8 mx-auto text-indigo-600 dark:text-indigo-400 animate-spin"
            strokeWidth={2}
          />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User
            className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-600"
            strokeWidth={2}
          />
          <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
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
    stats: null,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} />

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-6">
          {/* Tabs Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200/80 dark:border-white/5 p-2">
            <nav className="flex gap-1" aria-label="Profile tabs">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                const count = tabCounts[tab.id];

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'group relative inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all flex-1',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400 text-white shadow-lg shadow-indigo-500/25 dark:shadow-indigo-400/20'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50'
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    <span>{tab.label}</span>

                    {/* Count Badge */}
                    {count !== null && count > 0 && (
                      <span
                        className={cn(
                          'ml-1 rounded-full px-2 py-0.5 text-xs font-bold transition-colors',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
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
