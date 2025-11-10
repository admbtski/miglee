'use client';

import { useState } from 'react';
import { Modal } from '@/components/feedback/modal';
import { X } from 'lucide-react';
import { AccountTab } from './tabs/account-tab';
import { CommunicationTab } from './tabs/communication-tab';
import { SecurityTab } from './tabs/security-tab';
import { ContentTab } from './tabs/content-tab';
import { IntentsTab } from './tabs/intents-tab';
import { DiagnosticTools } from './tabs/diagnostic-tools';
import { AuditLogTab } from './tabs/audit-log-tab';
import { useUserQuery } from '@/lib/api/users';

type UserDetailModalProps = {
  userId: string;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
};

type TabId =
  | 'account'
  | 'communication'
  | 'security'
  | 'content'
  | 'intents'
  | 'tools'
  | 'audit';

const tabs: { id: TabId; label: string }[] = [
  { id: 'account', label: 'Konto' },
  { id: 'communication', label: 'Komunikacja' },
  { id: 'security', label: 'Bezpieczeństwo' },
  { id: 'content', label: 'Treści' },
  { id: 'intents', label: 'Wydarzenia' },
  { id: 'tools', label: 'Narzędzia' },
  { id: 'audit', label: 'Historia' },
];

export function UserDetailModal({
  userId,
  open,
  onClose,
  onRefresh,
}: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('account');
  const { data: userData } = useUserQuery({ id: userId });

  const handleClose = () => {
    setActiveTab('account');
    onClose();
  };

  const user = userData?.user;

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
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Zarządzanie użytkownikiem
          </h3>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      }
      content={
        <div className="space-y-4">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
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
            {activeTab === 'communication' && (
              <CommunicationTab userId={userId} />
            )}
            {activeTab === 'security' && (
              <SecurityTab userId={userId} onRefresh={onRefresh} />
            )}
            {activeTab === 'content' && <ContentTab userId={userId} />}
            {activeTab === 'intents' && <IntentsTab userId={userId} />}
            {activeTab === 'tools' && user && (
              <DiagnosticTools userId={userId} userName={user.name} />
            )}
            {activeTab === 'audit' && <AuditLogTab userId={userId} />}
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Zamknij
          </button>
        </div>
      }
    />
  );
}
