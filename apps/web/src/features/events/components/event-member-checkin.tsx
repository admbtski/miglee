'use client';

import { CheckCircle2, AlertCircle, Ban, QrCode } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

type CheckinMethod = 'SELF_MANUAL' | 'MODERATOR_PANEL' | 'EVENT_QR' | 'USER_QR';

interface EventMemberCheckinProps {
  event: {
    id: string;
    checkinEnabled: boolean;
    enabledCheckinMethods: CheckinMethod[];
  };
  membership: {
    isCheckedIn: boolean;
    checkinMethods: CheckinMethod[];
    checkinBlockedAll: boolean;
    checkinBlockedMethods: CheckinMethod[];
    lastCheckinRejectionReason?: string | null;
    memberCheckinToken?: string | null;
  } | null;
  onCheckin?: () => Promise<void>;
  onUncheck?: () => Promise<void>;
}

export function EventMemberCheckin({
  event,
  membership,
  onCheckin,
  onUncheck,
}: EventMemberCheckinProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  // Don't show if check-in is disabled
  if (!event.checkinEnabled) {
    return null;
  }

  // Don't show if user is not a member
  if (!membership) {
    return null;
  }

  const selfManualEnabled = event.enabledCheckinMethods.includes('SELF_MANUAL');
  const userQrEnabled = event.enabledCheckinMethods.includes('USER_QR');
  const isSelfManualBlocked =
    membership.checkinBlockedMethods.includes('SELF_MANUAL');

  // Check if user is blocked from all check-in methods
  if (membership.checkinBlockedAll) {
    return (
      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <Ban className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900">
              Check-in zablokowany
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Check-in został zablokowany przez organizatora.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show rejection message if exists
  const hasRejection = membership.lastCheckinRejectionReason;

  const handleAction = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (membership.isCheckedIn) {
        await onUncheck?.();
      } else {
        await onCheckin?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-zinc-700" />
          <h3 className="text-lg font-semibold text-zinc-900">
            Twoja obecność
          </h3>
        </div>

        {/* Rejection Warning */}
        {hasRejection && !membership.isCheckedIn && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  Check-in został odrzucony
                </p>
                <p className="text-sm text-amber-700 mt-0.5">
                  {membership.lastCheckinRejectionReason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Manual Check-in Button */}
        {selfManualEnabled && !isSelfManualBlocked && (
          <button
            onClick={handleAction}
            disabled={isLoading}
            className={`
              w-full px-4 py-3 rounded-lg font-medium transition-all
              ${
                membership.isCheckedIn
                  ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/25'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Przetwarzanie...</span>
              </span>
            ) : membership.isCheckedIn ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Cofnij check-in</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Jestem na wydarzeniu</span>
              </span>
            )}
          </button>
        )}

        {/* Blocked Manual Check-in */}
        {selfManualEnabled && isSelfManualBlocked && (
          <div className="rounded-lg bg-zinc-100 border border-zinc-200 p-3 text-center">
            <p className="text-sm text-zinc-600">
              Manualny check-in został zablokowany przez organizatora.
            </p>
          </div>
        )}

        {/* Status Display */}
        {membership.isCheckedIn && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-zinc-600">
              Obecność potwierdzona{' '}
              {membership.checkinMethods.length > 0 && (
                <span className="text-zinc-400">
                  ({membership.checkinMethods.join(', ')})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* User QR Code Section */}
      {userQrEnabled && membership.memberCheckinToken && (
        <div className="rounded-lg border-2 border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="h-5 w-5 text-zinc-700" />
            <h3 className="text-lg font-semibold text-zinc-900">Mój kod QR</h3>
          </div>
          <p className="text-sm text-zinc-600 mb-4">
            Pokaż ten kod organizatorowi, aby potwierdzić swoją obecność.
          </p>

          {/* QR Code placeholder - would need QR library in production */}
          <div className="bg-zinc-100 rounded-lg p-8 flex items-center justify-center">
            <div className="text-center">
              <QrCode className="h-32 w-32 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 font-mono break-all">
                {membership.memberCheckinToken.slice(0, 16)}...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
