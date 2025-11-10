'use client';

import { useState } from 'react';
import { Send, Bell, AlertCircle } from 'lucide-react';
import { NoticeModal } from '@/components/feedback/notice-modal';
import { useAddNotificationMutation } from '@/lib/api/notifications';
import { NotificationKind } from '@/lib/api/__generated__/react-query-update';

type CommunicationTabProps = {
  userId: string;
};

export function CommunicationTab({ userId }: CommunicationTabProps) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addNotificationMutation = useAddNotificationMutation();

  const handleSendNotification = async () => {
    setError(null);

    try {
      await addNotificationMutation.mutateAsync({
        recipientId: userId,
        kind: NotificationKind.System,
        title: notificationTitle,
        body: notificationBody,
      });

      setNotificationOpen(false);
      setSuccessOpen(true);
      setNotificationTitle('');
      setNotificationBody('');
    } catch (err: any) {
      setError(
        err?.response?.errors?.[0]?.message ||
          'Wystąpił błąd podczas wysyłania powiadomienia'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Send Notification */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Powiadomienia systemowe
        </h5>
        <button
          onClick={() => setNotificationOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Send className="h-4 w-4" />
          Wyślij powiadomienie
        </button>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Preferencje powiadomień
        </h5>
        <div className="space-y-2">
          <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Email
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Powiadomienia na adres email
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Push
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Powiadomienia push w aplikacji
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  In-app
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Powiadomienia w aplikacji
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Uwaga: Zmiany preferencji powiadomień będą dostępne wkrótce
        </p>
      </div>

      {/* Send Notification Modal */}
      {notificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 dark:bg-gray-900">
            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Wyślij powiadomienie systemowe
            </h4>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tytuł
                </label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Wpisz tytuł powiadomienia..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Treść
                </label>
                <textarea
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  placeholder="Wpisz treść powiadomienia..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              {/* Preview */}
              {(notificationTitle || notificationBody) && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                    Podgląd:
                  </p>
                  <div className="rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-900">
                    {notificationTitle && (
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {notificationTitle}
                      </p>
                    )}
                    {notificationBody && (
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {notificationBody}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-xs text-red-800 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setNotificationOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Anuluj
              </button>
              <button
                onClick={handleSendNotification}
                disabled={
                  !notificationTitle ||
                  !notificationBody ||
                  addNotificationMutation.isPending
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addNotificationMutation.isPending ? 'Wysyłanie...' : 'Wyślij'}
              </button>
            </div>
          </div>
        </div>
      )}

      <NoticeModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        variant="success"
        size="sm"
        title="Powiadomienie wysłane"
        subtitle="Użytkownik otrzyma powiadomienie w ciągu kilku minut"
        autoCloseMs={2000}
      >
        <></>
      </NoticeModal>
    </div>
  );
}
