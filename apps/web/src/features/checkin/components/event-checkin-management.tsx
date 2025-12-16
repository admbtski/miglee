'use client';

import { QrCode, Settings, List, Download } from 'lucide-react';
import { useState } from 'react';

type CheckinMethod = 'SELF_MANUAL' | 'MODERATOR_PANEL' | 'EVENT_QR' | 'USER_QR';

interface EventCheckinManagementProps {
  eventId: string;
  event: {
    checkinEnabled: boolean;
    enabledCheckinMethods: CheckinMethod[];
    eventCheckinToken?: string | null;
  };
  members: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      avatarKey?: string | null;
    };
    isCheckedIn: boolean;
    checkinMethods: CheckinMethod[];
    checkinBlockedAll: boolean;
    lastCheckinRejectionReason?: string | null;
  }>;
  onRefetch?: () => void;
}

export function EventCheckinManagement({
  event,
  members,
}: EventCheckinManagementProps) {
  const [selectedTab, setSelectedTab] = useState<
    'list' | 'settings' | 'qr' | 'logs'
  >('list');

  const joinedMembers = members.filter((m) => m.isCheckedIn !== undefined);
  const checkedInCount = joinedMembers.filter((m) => m.isCheckedIn).length;
  const totalCount = joinedMembers.length;
  const percentage =
    totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  if (!event.checkinEnabled) {
    return (
      <div className="rounded-lg border-2 border-zinc-200 bg-zinc-50 p-8 text-center">
        <Settings className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">
          Check-in nie jest włączony
        </h3>
        <p className="text-sm text-zinc-600 mb-4">
          Włącz check-in w ustawieniach, aby rozpocząć śledzenie obecności.
        </p>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          onClick={() => setSelectedTab('settings')}
        >
          Przejdź do ustawień
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-zinc-600 mb-1">Obecni</p>
            <p className="text-3xl font-bold text-indigo-600">
              {checkedInCount}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-600 mb-1">Łącznie uczestników</p>
            <p className="text-3xl font-bold text-zinc-900">{totalCount}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600 mb-1">Procent obecnych</p>
            <p className="text-3xl font-bold text-green-600">{percentage}%</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="flex gap-4">
          {[
            { id: 'list' as const, icon: List, label: 'Lista uczestników' },
            { id: 'settings' as const, icon: Settings, label: 'Ustawienia' },
            { id: 'qr' as const, icon: QrCode, label: 'QR wydarzenia' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 transition-colors
                ${
                  selectedTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900'
                }
              `}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'list' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-600">
              {joinedMembers.length} uczestników
            </p>
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">
              <Download className="h-4 w-4" />
              <span>Eksportuj PDF</span>
            </button>
          </div>

          {joinedMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg border border-zinc-200 p-4 hover:border-zinc-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-200 flex items-center justify-center">
                    <span className="text-sm font-semibold text-zinc-700">
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">
                      {member.user.name}
                    </p>
                    {member.isCheckedIn ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs text-green-600 font-medium">
                          Obecny
                        </span>
                        {member.checkinMethods.length > 0 && (
                          <span className="text-xs text-zinc-400">
                            • {member.checkinMethods.join(', ')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-zinc-300" />
                        <span className="text-xs text-zinc-500">Nieobecny</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.checkinBlockedAll && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      Zablokowany
                    </span>
                  )}
                  {!member.isCheckedIn && !member.checkinBlockedAll && (
                    <button
                      className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                      onClick={() => {
                        // TODO: Call check-in mutation
                        console.log('Check in', member.id);
                      }}
                    >
                      Check-in
                    </button>
                  )}
                  {member.isCheckedIn && (
                    <button
                      className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-sm rounded-lg hover:bg-zinc-200 transition-colors"
                      onClick={() => {
                        // TODO: Call uncheck mutation
                        console.log('Uncheck', member.id);
                      }}
                    >
                      Cofnij
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTab === 'settings' && (
        <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              Ustawienia check-in
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">Włącz check-in</p>
                  <p className="text-sm text-zinc-600">
                    Pozwól uczestnikom potwierdzić swoją obecność
                  </p>
                </div>
                <button
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${event.checkinEnabled ? 'bg-indigo-600' : 'bg-zinc-300'}
                  `}
                >
                  <div
                    className={`
                      absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                      ${event.checkinEnabled ? 'translate-x-6' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-zinc-200">
                <p className="font-medium text-zinc-900 mb-3">
                  Metody check-in
                </p>
                <div className="space-y-2">
                  {[
                    {
                      id: 'SELF_MANUAL',
                      label: 'Manualny (przycisk użytkownika)',
                    },
                    { id: 'MODERATOR_PANEL', label: 'Panel organizatora' },
                    { id: 'EVENT_QR', label: 'QR wydarzenia (wspólny)' },
                    { id: 'USER_QR', label: 'QR użytkownika (indywidualny)' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={event.enabledCheckinMethods.includes(
                          method.id as CheckinMethod
                        )}
                        className="h-4 w-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                        readOnly
                      />
                      <span className="text-sm text-zinc-900">
                        {method.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'qr' &&
        event.enabledCheckinMethods.includes('EVENT_QR') && (
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              QR kod wydarzenia
            </h3>
            <p className="text-sm text-zinc-600 mb-6">
              Wyświetl ten kod w miejscu wydarzenia. Uczestnicy mogą go
              zeskanować, aby potwierdzić obecność.
            </p>

            {/* QR Code Placeholder */}
            <div className="bg-zinc-100 rounded-lg p-12 flex items-center justify-center">
              <div className="text-center">
                <QrCode className="h-48 w-48 text-zinc-400 mx-auto mb-4" />
                <p className="text-xs text-zinc-500 font-mono">
                  {event.eventCheckinToken?.slice(0, 24)}...
                </p>
                <div className="flex gap-3 mt-6 justify-center">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Pełny ekran
                  </button>
                  <button className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors">
                    Pobierz PNG
                  </button>
                  <button className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors">
                    Pobierz PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-900">
                <strong>Bezpieczeństwo:</strong> W razie konieczności możesz
                zregenerować kod QR w ustawieniach.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
