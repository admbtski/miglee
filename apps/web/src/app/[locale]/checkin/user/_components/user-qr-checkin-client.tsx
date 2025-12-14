/**
 * User QR Check-in Client Component
 * Handles check-in when moderator scans participant's personal QR code
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  ArrowRight,
  QrCode,
  UserCheck,
  Calendar,
  Clock,
} from 'lucide-react';
import { useCheckInByUserQrMutation } from '@/features/events/api/checkin';

interface UserQRCheckinClientProps {
  token?: string;
}

type CheckinState = 'loading' | 'success' | 'error' | 'invalid';

export function UserQRCheckinClient({ token }: UserQRCheckinClientProps) {
  const router = useRouter();
  const [state, setState] = useState<CheckinState>('loading');
  const [message, setMessage] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  const [eventName, setEventName] = useState<string>('');
  const [eventId, setEventId] = useState<string>('');
  const [checkinTime, setCheckinTime] = useState<string>('');

  const checkInMutation = useCheckInByUserQrMutation({
    onSuccess: (data) => {
      setState('success');
      setMessage(
        data?.checkInByUserQr?.message || 'Participant successfully checked in!'
      );

      if (data?.checkInByUserQr?.member?.user?.name) {
        setMemberName(data.checkInByUserQr.member.user.name);
      }

      if (data?.checkInByUserQr?.event?.title) {
        setEventName(data.checkInByUserQr.event.title);
      }

      if (data?.checkInByUserQr?.event?.id) {
        setEventId(data.checkInByUserQr.event.id);
      }

      // Set current time
      setCheckinTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    },
    onError: (error) => {
      setState('error');
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Failed to check in participant. Please try again.');
      }
    },
  });

  useEffect(() => {
    // Validate token presence
    if (!token) {
      setState('invalid');
      setMessage('Invalid QR code - missing token');
      return;
    }

    // Automatically trigger check-in
    const performCheckin = async () => {
      console.log('[UserQRCheckin] Starting check-in...', {
        token: token.substring(0, 10) + '...',
      });

      try {
        await checkInMutation.mutateAsync({ token });
      } catch (error) {
        console.error('[UserQRCheckin] Check-in failed:', error);
        // Error handled by onError callback
      }
    };

    performCheckin();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoToEvent = () => {
    if (eventId) {
      router.push(`/event/${eventId}/manage/checkin`);
    } else {
      router.push('/');
    }
  };

  const handleScanAnother = () => {
    // Reset state and allow scanning another QR
    setState('loading');
    router.refresh();
  };

  const handleTryAgain = () => {
    setState('loading');
    checkInMutation.mutate({ token: token || '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Loading State */}
          {state === 'loading' && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-indigo-100 p-4 dark:bg-indigo-900/30">
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Checking in participant...
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Please wait while we verify the check-in
              </p>
            </div>
          )}

          {/* Success State */}
          {state === 'success' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-lg dark:border-emerald-800/50 dark:bg-zinc-900">
                <div className="mb-6 flex justify-center">
                  <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>

                <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Check-in Successful!
                </h1>

                {memberName && (
                  <div className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                    <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span>{memberName}</span>
                  </div>
                )}

                <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                  {message}
                </p>

                {/* Check-in Details */}
                <div className="mb-6 space-y-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                  {eventName && (
                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <span>{eventName}</span>
                    </div>
                  )}
                  {checkinTime && (
                    <div className="flex items-center justify-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <Clock className="h-4 w-4 text-zinc-500" />
                      <span>Checked in at {checkinTime}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <QrCode className="h-4 w-4 text-zinc-500" />
                    <span>Method: Personal QR Code</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleGoToEvent}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    View Check-in Management
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleScanAnother}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    <QrCode className="h-5 w-5" />
                    Scan Another Participant
                  </button>
                </div>
              </div>

              {/* Moderator Context Notice */}
              <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-900/20">
                <div className="flex items-start gap-3">
                  <UserCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <div className="text-sm text-indigo-900 dark:text-indigo-100">
                    <p className="font-medium">Moderator Action</p>
                    <p className="mt-1 text-indigo-700 dark:text-indigo-300">
                      You have successfully checked in this participant using
                      their personal QR code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg dark:border-red-800/50 dark:bg-zinc-900">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
                  <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Check-in Failed
              </h1>
              <p className="mb-6 text-zinc-600 dark:text-zinc-400">{message}</p>

              {/* Common Error Reasons */}
              <div className="mb-6 rounded-xl bg-red-50 p-4 text-left dark:bg-red-900/10">
                <p className="mb-2 text-sm font-medium text-red-900 dark:text-red-100">
                  Common reasons:
                </p>
                <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600" />
                    <span>Participant is already checked in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600" />
                    <span>You don&apos;t have moderator permissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600" />
                    <span>Participant is blocked from checking in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600" />
                    <span>QR code method is not enabled for this event</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleTryAgain}
                  disabled={checkInMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {checkInMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>Try Again</>
                  )}
                </button>
                <button
                  onClick={handleGoToEvent}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Back to Event
                </button>
              </div>
            </div>
          )}

          {/* Invalid Token State */}
          {state === 'invalid' && (
            <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-lg dark:border-amber-800/50 dark:bg-zinc-900">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
                  <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Invalid QR Code
              </h1>
              <p className="mb-6 text-zinc-600 dark:text-zinc-400">{message}</p>
              <button
                onClick={() => router.push('/')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                Go to Home
              </button>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800">
            <div className="flex items-start gap-3">
              <QrCode className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-500" />
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  About Personal QR Check-in
                </p>
                <p className="mt-1">
                  Scan a participant&apos;s personal QR code to check them in.
                  You must be a moderator or owner of the event to perform this
                  action.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
