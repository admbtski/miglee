/**
 * Profile Settings Page
 *
 * Manages profile, sports preferences, social links, and privacy settings.
 * Uses tabbed navigation for different settings sections.
 *
 * Header and tabs render immediately, tab content loads async.
 *
 * TODO: add translation (i18n) - tab labels, loading states (marked inline)
 */

'use client';

import {
  Calendar,
  Link as LinkIcon,
  Loader2,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { Suspense, useState } from 'react';

import { useAccount } from '@/features/account';

import {
  PrivacyTab,
  ProfileTab,
  SocialLinksTab,
  SportsTab,
  TabConfig,
  TabId,
  useMyFullProfileQuery,
} from '@/features/profile-settings';

// TODO i18n: tab labels
const TABS: TabConfig[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'sports', label: 'Sports & Availability', icon: Calendar },
  { id: 'social', label: 'Social Links', icon: LinkIcon },
  { id: 'privacy', label: 'Privacy', icon: Shield },
];

function getTabClasses(isActive: boolean): string {
  const base =
    'group inline-flex items-center gap-2.5 border-b-2 px-1 py-3 text-sm font-semibold transition-colors';

  if (isActive) {
    return `${base} border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400`;
  }

  return `${base} border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100`;
}

function getTabIconClasses(isActive: boolean): string {
  const base = 'h-5 w-5';

  if (isActive) {
    return `${base} text-indigo-600 dark:text-indigo-400`;
  }

  return `${base} text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-400`;
}

// TODO i18n: Loading...
function TabContentLoader() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Loading...
        </p>
      </div>
    </div>
  );
}

function UnauthenticatedState() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="text-center">
        <Settings className="mx-auto h-12 w-12 text-zinc-400" />
        {/* TODO i18n: Not authenticated */}
        <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Not authenticated
        </p>
        {/* TODO i18n: Please log in to view your profile */}
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Please log in to view your profile
        </p>
      </div>
    </div>
  );
}

/**
 * Tab content component that handles data fetching internally
 * This allows the header and tabs to render immediately while content loads
 */
function ProfileTabContent({ activeTab }: { activeTab: TabId }) {
  // User data is provided by AccountProvider
  const { user: currentUser, isLoading: isLoadingAuth } = useAccount();
  const userId = currentUser?.id;

  const { data: profileData, isLoading: isLoadingProfile } =
    useMyFullProfileQuery({ id: userId ?? '' }, { enabled: Boolean(userId) });

  // Show loader only when actually loading
  const isLoading = isLoadingAuth || (userId && isLoadingProfile);

  if (isLoading) {
    return <TabContentLoader />;
  }

  if (!userId) {
    return <UnauthenticatedState />;
  }

  const user = profileData?.user;

  return (
    <>
      {activeTab === 'profile' && <ProfileTab user={user} userId={userId} />}
      {activeTab === 'sports' && <SportsTab user={user} userId={userId} />}
      {activeTab === 'social' && <SocialLinksTab user={user} userId={userId} />}
      {activeTab === 'privacy' && <PrivacyTab user={user} userId={userId} />}
    </>
  );
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  return (
    <div className="space-y-8">
      {/* Header - always visible immediately */}
      <div className="space-y-2">
        {/* TODO i18n: Profile Settings */}
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Profile Settings
        </h1>
        {/* TODO i18n: Manage your public profile, sports preferences, and privacy settings */}
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[70ch]">
          Manage your public profile, sports preferences, and privacy settings
        </p>
      </div>

      {/* Tabs - always visible immediately */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav
          className="flex -mb-px gap-4 sm:gap-6"
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

      {/* Tab content - loads with single loader inside */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Suspense fallback={<TabContentLoader />}>
          <ProfileTabContent activeTab={activeTab} />
        </Suspense>
      </div>
    </div>
  );
}
