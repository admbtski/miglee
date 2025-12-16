/**
 * Event QR Check-in Client Component
 * Handles automatic check-in when user scans event QR code
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
} from 'lucide-react';
import { useCheckInByEventQrMutation } from '@/features/checkin';

interface EventQRCheckinClientProps {
  eventId: string;
  token?: string;
}

type CheckinState = 'loading' | 'success' | 'error' | 'invalid';

export function EventQRCheckinClient({
  eventId,
  token,
}: EventQRCheckinClientProps) {
  const router = useRouter();
  const [state, setState] = useState<CheckinState>('loading');
  const [message, setMessage] = useState<string>('');
  const [eventName, setEventName] = useState<string>('');

  const checkInMutation = useCheckInByEventQrMutation({
    onSuccess: (data) => {
      setState('success');
      setMessage(data?.checkInByEventQr?.message || 'Successfully checked in!');
      if (data?.checkInByEventQr?.event?.title) {
        setEventName(data.checkInByEventQr.event.title);
      }
    },
    onError: (error) => {
      setState('error');
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Failed to check in. Please try again.');
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
      console.log('[EventQRCheckin] Starting check-in...', {
        eventId,
        token: token.substring(0, 10) + '...',
      });

      try {
        await checkInMutation.mutateAsync({ eventId, token });
      } catch (error) {
        console.error('[EventQRCheckin] Check-in failed:', error);
        // Error handled by onError callback
      }
    };

    performCheckin();
  }, [eventId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoToEvent = () => {
    router.push(`/event/${eventId}`);
  };

  const handleTryAgain = () => {
    setState('loading');
    checkInMutation.mutate({ eventId, token: token || '' });
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
                Checking you in...
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Please wait while we verify your check-in
              </p>
            </div>
          )}

          {/* Success State */}
          {state === 'success' && (
            <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-lg dark:border-emerald-800/50 dark:bg-zinc-900">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Successfully Checked In!
              </h1>
              {eventName && (
                <p className="mb-4 text-lg font-medium text-zinc-700 dark:text-zinc-300">
                  {eventName}
                </p>
              )}
              <p className="mb-6 text-zinc-600 dark:text-zinc-400">{message}</p>
              <button
                onClick={handleGoToEvent}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                View Event Details
                <ArrowRight className="h-5 w-5" />
              </button>
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
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleTryAgain}
                  disabled={checkInMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {checkInMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>Try Again</>
                  )}
                </button>
                <button
                  onClick={handleGoToEvent}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  View Event
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
                onClick={handleGoToEvent}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                View Event
              </button>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
            <div className="flex items-start gap-3">
              <QrCode className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-500" />
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  About Event QR Check-in
                </p>
                <p className="mt-1">
                  Scan the event QR code at the venue entrance to automatically
                  check in. Make sure you&apos;re a registered participant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
