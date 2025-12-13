/**
 * User Check-in Component
 * Allows users to check in to events they've joined
 */

'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  useCheckInSelfMutation,
  useUncheckInSelfMutation,
} from '@/features/events/api/checkin';

interface UserCheckinSectionProps {
  eventId: string;
  isJoined: boolean;
  checkinEnabled: boolean;
  checkinMethods: string[];
  isCheckedIn: boolean;
  userCheckinMethods: string[];
  isBlocked: boolean;
  rejectionReason?: string | null;
  memberCheckinToken?: string | null;
}

export function UserCheckinSection({
  eventId,
  isJoined,
  checkinEnabled,
  checkinMethods,
  isCheckedIn,
  userCheckinMethods,
  isBlocked,
  rejectionReason,
  memberCheckinToken,
}: UserCheckinSectionProps) {
  const [showQR, setShowQR] = useState(false);

  const checkInMutation = useCheckInSelfMutation();
  const uncheckInMutation = useUncheckInSelfMutation();

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
      if (result.success) {
        toast.success('Check-in successful!', {
          description: result.message,
        });
      } else {
        toast.error('Check-in failed', {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error('Check-in failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handleUncheck = async () => {
    try {
      const result = await uncheckInMutation.mutateAsync({ eventId });
      if (result.success) {
        toast.success('Check-in removed', {
          description: result.message,
        });
      } else {
        toast.error('Failed to remove check-in', {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error('Failed to remove check-in', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-zinc-900">Your Presence</h3>
      </div>

      {/* Blocked Status */}
      {isBlocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-red-900">Check-in Blocked</div>
              <div className="mt-1 text-sm text-red-700">
                Check-in has been blocked by the organizer.
              </div>
              {rejectionReason && (
                <div className="mt-2 text-sm text-red-600 italic">
                  Reason: {rejectionReason}
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
          className="rounded-lg border border-amber-200 bg-amber-50 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-amber-900">
                Previous Check-in Rejected
              </div>
              <div className="mt-1 text-sm text-amber-700">
                Your last check-in was rejected by the organizer.
              </div>
              <div className="mt-2 text-sm text-amber-600 italic">
                Reason: {rejectionReason}
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
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-emerald-900">
                You&apos;re checked in! ✓
              </div>
              <div className="mt-1 text-sm text-emerald-700">
                Your presence at this event has been confirmed.
              </div>
              {userCheckinMethods.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {userCheckinMethods.map((method) => (
                    <span
                      key={method}
                      className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
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
                  className="mt-3 text-sm font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
                >
                  {isLoading ? 'Removing...' : 'Remove my check-in'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Check-in Button */}
      {!isCheckedIn && !isBlocked && canSelfCheckin && (
        <motion.button
          onClick={handleCheckin}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-indigo-500/30 transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
      {canUseUserQR && !isBlocked && memberCheckinToken && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-zinc-600" />
              <div>
                <div className="font-medium text-zinc-900">My QR Code</div>
                <div className="text-sm text-zinc-600">
                  Show this to the organizer
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowQR(!showQR)}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {showQR ? 'Hide' : 'Show'} QR
            </button>
          </div>

          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                {memberCheckinToken ? (
                  <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-6">
                    {/* QR code will be rendered here using UserQRCode component */}
                    <div className="text-xs text-zinc-500">
                      Your personal check-in code
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-700">
                    QR code not available. Please contact the organizer.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Instructions */}
      {!isCheckedIn && !isBlocked && (
        <div className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
          <div className="font-medium text-zinc-900 mb-2">How to check in:</div>
          <ul className="space-y-1 list-disc list-inside">
            {canSelfCheckin && (
              <li>Click the &quot;I&apos;m at the event!&quot; button above</li>
            )}
            {canUseUserQR && <li>Show your QR code to the event staff</li>}
            {checkinMethods.includes('EVENT_QR') && (
              <li>Scan the event QR code at the entrance</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
