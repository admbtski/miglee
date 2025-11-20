'use client';

import { useState } from 'react';
import { useAdminUpdateIntentMutation } from '@/lib/api/admin-intents';
import { Eye, EyeOff, Lock, Unlock, Save } from 'lucide-react';
import { Visibility } from '@/lib/api/__generated__/react-query-update';

type SettingsTabProps = {
  intent: any;
  onRefresh?: () => void;
};

export function SettingsTab({ intent, onRefresh }: SettingsTabProps) {
  const [visibility, setVisibility] = useState(intent.visibility);
  const [joinManuallyClosed, setJoinManuallyClosed] = useState(
    intent.joinManuallyClosed || false
  );
  const [joinManualCloseReason, setJoinManualCloseReason] = useState(
    intent.joinManualCloseReason || ''
  );

  const updateMutation = useAdminUpdateIntentMutation();

  const handleSaveSettings = async () => {
    try {
      await updateMutation.mutateAsync({
        id: intent.id,
        input: {
          visibility,
          joinManuallyClosed,
          joinManualCloseReason: joinManuallyClosed
            ? joinManualCloseReason
            : undefined,
        },
      });
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visibility */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Widoczność
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => setVisibility(Visibility.Public)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              visibility === Visibility.Public
                ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Publiczne</span>
          </button>
          <button
            onClick={() => setVisibility(Visibility.Hidden)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              visibility === Visibility.Hidden
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
            }`}
          >
            <EyeOff className="h-4 w-4" />
            <span className="text-sm font-medium">Ukryte</span>
          </button>
        </div>
      </div>

      {/* Join Lock */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Ręczne zarządzanie zapisami
        </h3>
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <button
              onClick={() => setJoinManuallyClosed(false)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                !joinManuallyClosed
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                  : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
              }`}
            >
              <Unlock className="h-4 w-4" />
              <span className="text-sm font-medium">Otwarte</span>
            </button>
            <button
              onClick={() => setJoinManuallyClosed(true)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                joinManuallyClosed
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                  : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">Zamknięte</span>
            </button>
          </div>

          {joinManuallyClosed && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Powód zamknięcia
              </label>
              <textarea
                value={joinManualCloseReason}
                onChange={(e) => setJoinManualCloseReason(e.target.value)}
                placeholder="Wpisz powód zamknięcia zapisów..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? 'Zapisywanie...' : 'Zapisz ustawienia'}
        </button>
      </div>

      {/* Owner Change (placeholder) */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Zmiana właściciela
        </h3>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>Informacja:</strong> Funkcja zmiany właściciela będzie
            dostępna w przyszłych wersjach.
          </p>
        </div>
      </div>
    </div>
  );
}
