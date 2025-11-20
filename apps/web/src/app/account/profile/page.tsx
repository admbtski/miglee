/**
 * Profile Settings Page
 * Allows users to manage their profile, sports, social links, and privacy settings
 */

'use client';

import { useState } from 'react';
import {
  User,
  Shield,
  Link as LinkIcon,
  Calendar,
  Settings,
} from 'lucide-react';

import { useMeQuery } from '@/lib/api/auth';
import { useMyFullProfileQuery } from '@/lib/api/user-profile';

import { ProfileTab } from './_components/profile-tab';
import { SportsTab } from './_components/sports-tab';
import { SocialLinksTab } from './_components/social-links-tab';
import { PrivacyTab } from './_components/privacy-tab';
import type { TabId, TabConfig } from './_types';

const TABS: TabConfig[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'sports', label: 'Sports & Availability', icon: Calendar },
  { id: 'social', label: 'Social Links', icon: LinkIcon },
  { id: 'privacy', label: 'Privacy', icon: Shield },
];

function getTabClasses(isActive: boolean): string {
  const base =
    'group inline-flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors';

  if (isActive) {
    return `${base} border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400`;
  }

  return `${base} border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100`;
}

function getTabIconClasses(isActive: boolean): string {
  const base = 'h-5 w-5';

  if (isActive) {
    return `${base} text-blue-600 dark:text-blue-400`;
  }

  return `${base} text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-400`;
}

function LoadingState() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Loading profile...
        </p>
      </div>
    </div>
  );
}

function UnauthenticatedState() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <Settings className="mx-auto h-12 w-12 text-zinc-400" />
        <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Not authenticated
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Please log in to view your profile
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const { data: authData, isLoading: isLoadingAuth } = useMeQuery();
  const userId = authData?.me?.id;

  const { data: profileData, isLoading: isLoadingProfile } =
    useMyFullProfileQuery({ id: userId ?? '' }, { enabled: Boolean(userId) });

  const isLoading = isLoadingAuth || isLoadingProfile;

  if (isLoading) {
    return <LoadingState />;
  }

  if (!userId) {
    return <UnauthenticatedState />;
  }

  const user = profileData?.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Profile Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your public profile and privacy settings
        </p>
      </div>

      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav
          className="-mb-px flex space-x-8"
          aria-label="Profile settings tabs"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={getTabClasses(isActive)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={getTabIconClasses(isActive)} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {activeTab === 'profile' && <ProfileTab user={user} userId={userId} />}
        {activeTab === 'sports' && <SportsTab user={user} userId={userId} />}
        {activeTab === 'social' && (
          <SocialLinksTab user={user} userId={userId} />
        )}
        {activeTab === 'privacy' && <PrivacyTab user={user} userId={userId} />}
      </div>
    </div>
  );
}
