/**
 * User Check-in Component
 * Allows users to check in to events they've joined
 */

'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  useCheckInSelfMutation,
  useUncheckInSelfMutation,
  useRotateMemberCheckinTokenMutation,
} from '@/features/checkin';
import { UserQRCode } from './user-qr-code';
import { useMeQuery } from '@/features/auth';

interface UserCheckinSectionProps {
  eventId: string;
  userId?: string;
  isJoined: boolean;
  checkinEnabled: boolean;
  checkinMethods: string[];
  isCheckedIn: boolean;
  userCheckinMethods: string[];
  isBlocked: boolean;
  rejectionReason?: string | null;
  memberCheckinToken?: string | null;
  eventName?: string;
}

export function UserCheckinSection({
  eventId,
  userId,
  isJoined,
  checkinEnabled,
  checkinMethods,
  isCheckedIn,
  userCheckinMethods,
  isBlocked,
  rejectionReason,
  memberCheckinToken,
  eventName = 'Event',
}: UserCheckinSectionProps) {
  const [showQR, setShowQR] = useState(false);
  const [localToken, setLocalToken] = useState(memberCheckinToken);
  const { data: authData } = useMeQuery();

  const checkInMutation = useCheckInSelfMutation();
  const uncheckInMutation = useUncheckInSelfMutation();
  const rotateTokenMutation = useRotateMemberCheckinTokenMutation({
    onSuccess: (data) => {
      if (data.rotateMemberCheckinToken?.memberCheckinToken) {
        setLocalToken(data.rotateMemberCheckinToken.memberCheckinToken);
        toast.success('QR code generated successfully');
        setShowQR(true); // Auto-show QR after generation
      }
    },
    onError: (error) => {
      toast.error('Failed to generate QR code', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });

  // Update local token when prop changes
  useEffect(() => {
    if (memberCheckinToken) {
      setLocalToken(memberCheckinToken);
    }
  }, [memberCheckinToken]);

  const handleGenerateQR = () => {
    if (!userId) {
      toast.error('Cannot generate QR code', {
        description: 'User ID is missing',
      });
      return;
    }

    rotateTokenMutation.mutate({ eventId, userId });
  };

  // Don't show if check-in is disabled or user is not joined
  if (!checkinEnabled || !isJoined) {
    return null;
  }

  const canSelfCheckin = checkinMethods.includes('SELF_MANUAL');
  const canUseUserQR = checkinMethods.includes('USER_QR');
  const hasManualCheckin = userCheckinMethods.includes('SELF_MANUAL');
  const isLoading = checkInMutation.isPending || uncheckInMutation.isPending;

  const handleCheckin = async () => {
    try {
      const result = await checkInMutation.mutateAsync({ eventId });
      if (result.checkInSelf?.success) {
        toast.success('Check-in successful!', {
          description: result.checkInSelf.message || undefined,
        });
      } else {
        toast.error('Check-in failed', {
          description: result.checkInSelf?.message || undefined,
        });
      }
    } catch (error) {
      toast.error('Check-in failed', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handleUncheck = async () => {
    try {
      const result = await uncheckInMutation.mutateAsync({ eventId });
      if (result.uncheckInSelf?.success) {
        toast.success('Check-in removed', {
          description: result.uncheckInSelf.message || undefined,
        });
      } else {
        toast.error('Failed to remove check-in', {
          description: result.uncheckInSelf?.message || undefined,
        });
      }
    } catch (error) {
      toast.error('Failed to remove check-in', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
          <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Your Presence
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Confirm your attendance at this event
          </p>
        </div>
      </div>

      {/* Blocked Status */}
      {isBlocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-red-900 dark:text-red-100">
                Check-in Blocked
              </div>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                Check-in has been blocked by the organizer.
              </div>
              {rejectionReason && (
                <div className="mt-3 rounded-lg bg-red-100 dark:bg-red-900/30 p-3">
                  <div className="text-xs font-medium text-red-900 dark:text-red-200 mb-1">
                    Reason:
                  </div>
                  <div className="text-sm text-red-800 dark:text-red-300 italic">
                    {rejectionReason}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Rejection Notice */}
      {!isBlocked && rejectionReason && !isCheckedIn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-amber-900 dark:text-amber-100">
                Previous Check-in Rejected
              </div>
              <div className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Your last check-in was rejected by the organizer.
              </div>
              <div className="mt-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 p-3">
                <div className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">
                  Reason:
                </div>
                <div className="text-sm text-amber-800 dark:text-amber-300 italic">
                  {rejectionReason}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Checked-in Status */}
      {isCheckedIn && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-900/20"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                You&apos;re checked in! ✓
              </div>
              <div className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                Your presence at this event has been confirmed.
              </div>
              {userCheckinMethods.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {userCheckinMethods.map((method) => (
                    <span
                      key={method}
                      className="inline-flex items-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200"
                    >
                      {method === 'SELF_MANUAL' && 'Manual'}
                      {method === 'MODERATOR_PANEL' && 'By Organizer'}
                      {method === 'EVENT_QR' && 'Event QR'}
                      {method === 'USER_QR' && 'Personal QR'}
                    </span>
                  ))}
                </div>
              )}
              {hasManualCheckin && canSelfCheckin && !isBlocked && (
                <button
                  onClick={handleUncheck}
                  disabled={isLoading}
                  className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Removing...' : 'Remove my check-in'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Check-in Button - Show if SELF_MANUAL is enabled and not already used */}
      {!hasManualCheckin && !isBlocked && canSelfCheckin && (
        <motion.button
          onClick={handleCheckin}
          disabled={isLoading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-center font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Checking in...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              I&apos;m at the event!
            </span>
          )}
        </motion.button>
      )}

      {/* User QR Code Section */}
      {canUseUserQR && !isBlocked && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                <QrCode className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  My QR Code
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {localToken
                    ? 'Show this to the organizer'
                    : 'Generate your personal QR code'}
                </div>
              </div>
            </div>
            {!localToken ? (
              <button
                onClick={handleGenerateQR}
                disabled={rotateTokenMutation.isPending}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 sm:w-auto dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {rotateTokenMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating...
                  </span>
                ) : (
                  'Generate QR'
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowQR(!showQR)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 sm:w-auto dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {showQR ? 'Hide' : 'Show'} QR
              </button>
            )}
          </div>

          <AnimatePresence>
            {showQR && localToken && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden"
              >
                {authData?.me ? (
                  <UserQRCode
                    eventId={eventId}
                    userId={authData.me.id}
                    memberId={authData.me.id}
                    token={localToken}
                    eventName={eventName}
                    userName={authData.me.name || 'User'}
                    onTokenRotated={(newToken) => setLocalToken(newToken)}
                  />
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                    User data not available
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Instructions */}
      {!isCheckedIn && !isBlocked && (
        <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-6">
          <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
            How to check in:
          </div>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            {canSelfCheckin && (
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                <span>
                  Click the &quot;I&apos;m at the event!&quot; button above
                </span>
              </li>
            )}
            {canUseUserQR && (
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                <span>Show your QR code to the event staff</span>
              </li>
            )}
            {checkinMethods.includes('EVENT_QR') && (
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                <span>Scan the event QR code at the entrance</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
