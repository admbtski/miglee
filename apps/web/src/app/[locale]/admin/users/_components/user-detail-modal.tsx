'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { X } from 'lucide-react';
import { AccountTab } from './tabs/account-tab';
import { CommunicationTab } from './tabs/communication-tab';
import { ActivityTab } from './tabs/activity-tab';
import { AuditLogTab } from './tabs/audit-log-tab';
import { NotificationsTab } from './tabs/notifications-tab';

type UserDetailModalProps = {
  userId: string;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
};

type TabId =
  | 'account'
  | 'activity'
  | 'communication'
  | 'notifications'
  | 'audit';

const tabs: { id: TabId; label: string }[] = [
  { id: 'account', label: 'Konto' },
  { id: 'activity', label: 'Aktywność' },
  { id: 'communication', label: 'Komunikacja' },
  { id: 'notifications', label: 'Powiadomienia' },
  { id: 'audit', label: 'Historia' },
];

export function UserDetailModal({
  userId,
  open,
  onClose,
  onRefresh,
}: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('account');

  const handleClose = () => {
    setActiveTab('account');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      variant="centered"
      size="xl"
      labelledById="user-detail-title"
      ariaLabel="Szczegóły użytkownika"
      header={
        <div className="flex items-center justify-between">
          <h3
            id="user-detail-title"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Zarządzanie użytkownikiem
          </h3>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      }
      content={
        <div className="space-y-4">
          {/* Tabs */}
          <div className="border-b border-zinc-200 dark:border-zinc-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'account' && (
              <AccountTab userId={userId} onRefresh={onRefresh} />
            )}
            {activeTab === 'activity' && <ActivityTab userId={userId} />}
            {activeTab === 'communication' && (
              <CommunicationTab userId={userId} />
            )}
            {activeTab === 'notifications' && (
              <NotificationsTab userId={userId} />
            )}
            {activeTab === 'audit' && <AuditLogTab userId={userId} />}
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Zamknij
          </button>
        </div>
      }
    />
  );
}
