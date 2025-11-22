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
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-zinc-950">
        <div className="text-center">
          <Loader2
            className="w-8 h-8 mx-auto text-indigo-600 dark:text-indigo-400 animate-spin"
            strokeWidth={2}
          />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-zinc-950">
        <div className="text-center">
          <User
            className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600"
            strokeWidth={2}
          />
          <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
            User not found
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
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
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} />

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs - Light Pill Style */}
        <div className="mb-6">
          <div className="max-w-xl mx-auto">
            <nav
              className="flex gap-2 justify-center"
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
                      'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm'
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    <span>{tab.label}</span>

                    {/* Count Badge */}
                    {count !== null && count > 0 && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          isActive
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300'
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

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
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
