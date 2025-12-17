'use client';

import { useState } from 'react';
import { useEventDetailQuery } from '@/features/events';
import {
  X,
  Info,
  Calendar,
  MapPin,
  Users,
  MessageSquare,
  Settings,
  Link as LinkIcon,
} from 'lucide-react';
import { BasicInfoTab } from './tabs/basic-info-tab';
import { TimeWindowsTab } from './tabs/time-windows-tab';
import { LocationTab } from './tabs/location-tab';
import { MembersTab } from './tabs/members-tab';
import { ContentTab } from './tabs/content-tab';
import { InviteLinksTab } from './tabs/invite-links-tab';
import { SettingsTab } from './tabs/settings-tab';

type EventDetailModalProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
};

type TabType =
  | 'basic'
  | 'time'
  | 'location'
  | 'members'
  | 'content'
  | 'links'
  | 'settings';

export function EventDetailModal({
  open,
  onClose,
  eventId,
}: EventDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  const { data, isLoading, refetch } = useEventDetailQuery(
    { id: eventId },
    { enabled: open }
  );

  const event = data?.event;

  if (!open) return null;

  const tabs = [
    { id: 'basic' as TabType, label: 'Podstawy', icon: Info },
    { id: 'time' as TabType, label: 'Czas i okna', icon: Calendar },
    { id: 'location' as TabType, label: 'Miejsce', icon: MapPin },
    { id: 'members' as TabType, label: 'Członkowie', icon: Users },
    { id: 'content' as TabType, label: 'Treści', icon: MessageSquare },
    { id: 'links' as TabType, label: 'Linki', icon: LinkIcon },
    { id: 'settings' as TabType, label: 'Ustawienia', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-lg bg-white dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {isLoading
                ? 'Ładowanie...'
                : event?.title || 'Szczegóły wydarzenia'}
            </h2>
            {event && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                ID: {event.id}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex gap-1 overflow-x-auto px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
            </div>
          )}

          {!isLoading && event && (
            <>
              {activeTab === 'basic' && (
                <BasicInfoTab event={event} onRefresh={refetch} />
              )}
              {activeTab === 'time' && (
                <TimeWindowsTab event={event} onRefresh={refetch} />
              )}
              {activeTab === 'location' && (
                <LocationTab event={event} onRefresh={refetch} />
              )}
              {activeTab === 'members' && (
                <MembersTab eventId={eventId} onRefresh={refetch} />
              )}
              {activeTab === 'content' && <ContentTab eventId={eventId} />}
              {activeTab === 'links' && <InviteLinksTab eventId={eventId} />}
              {activeTab === 'settings' && (
                <SettingsTab event={event} onRefresh={refetch} />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
