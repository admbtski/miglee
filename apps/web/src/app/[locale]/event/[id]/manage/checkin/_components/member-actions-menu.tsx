/**
 * Member Actions Menu Component
 * Dropdown menu for managing member check-in permissions
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Ban,
  CheckCircle,
  XCircle,
  Smartphone,
  Shield,
  QrCode,
  UserCircle2,
} from 'lucide-react';
import {
  CheckinMethod,
  EventMemberCoreFragment,
} from '@/lib/api/__generated__/react-query-update';
import {
  useBlockMemberCheckinMutation,
  useUnblockMemberCheckinMutation,
} from '@/features/checkin';
import { toast } from '@/lib/utils/toast-manager';

interface MemberActionsMenuProps {
  member: EventMemberCoreFragment;
  eventId: string;
}

export function MemberActionsMenu({ member, eventId }: MemberActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const blockMutation = useBlockMemberCheckinMutation({
    onSuccess: () => {
      toast.success('Check-in method blocked');
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to block method', {
        description: error.message,
      });
    },
  });

  const unblockMutation = useUnblockMemberCheckinMutation({
    onSuccess: () => {
      toast.success('Check-in method unblocked');
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to unblock method', {
        description: error.message,
      });
    },
  });

  // Close menu on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleBlockMethod = async (method: CheckinMethod) => {
    await blockMutation.mutateAsync({
      input: {
        eventId,
        userId: member.userId,
        method,
        blockAll: false,
      },
    });
  };

  const handleUnblockMethod = async (method: CheckinMethod) => {
    await unblockMutation.mutateAsync({
      input: {
        eventId,
        userId: member.userId,
        method,
        unblockAll: false,
      },
    });
  };

  const handleBlockAll = async () => {
    await blockMutation.mutateAsync({
      input: {
        eventId,
        userId: member.userId,
        blockAll: true,
      },
    });
  };

  const handleUnblockAll = async () => {
    await unblockMutation.mutateAsync({
      input: {
        eventId,
        userId: member.userId,
        unblockAll: true,
      },
    });
  };

  const methods = [
    {
      type: CheckinMethod.SelfManual,
      icon: Smartphone,
      label: 'Self Check-in',
    },
    {
      type: CheckinMethod.ModeratorPanel,
      icon: Shield,
      label: 'Moderator Panel',
    },
    { type: CheckinMethod.EventQr, icon: QrCode, label: 'Event QR' },
    { type: CheckinMethod.UserQr, icon: UserCircle2, label: 'User QR' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center rounded-lg border border-zinc-300 bg-white p-2 text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="More actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="p-1">
            {/* Block/Unblock all section */}
            <div className="border-b border-zinc-200 p-2 dark:border-zinc-700">
              <div className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                ALL METHODS
              </div>
              {member.checkinBlockedAll ? (
                <button
                  onClick={handleUnblockAll}
                  disabled={unblockMutation.isPending}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                >
                  <CheckCircle className="h-4 w-4" />
                  Unblock All Methods
                </button>
              ) : (
                <button
                  onClick={handleBlockAll}
                  disabled={blockMutation.isPending}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Ban className="h-4 w-4" />
                  Block All Methods
                </button>
              )}
            </div>

            {/* Individual methods section */}
            <div className="p-2">
              <div className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                INDIVIDUAL METHODS
              </div>
              <div className="space-y-1">
                {methods.map(({ type, icon: Icon, label }) => {
                  const isBlocked =
                    member.checkinBlockedAll ||
                    member.checkinBlockedMethods?.includes(type);

                  return (
                    <button
                      key={type}
                      onClick={() =>
                        isBlocked
                          ? handleUnblockMethod(type)
                          : handleBlockMethod(type)
                      }
                      disabled={
                        member.checkinBlockedAll ||
                        blockMutation.isPending ||
                        unblockMutation.isPending
                      }
                      className={[
                        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-50',
                        isBlocked
                          ? 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                          : 'text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20',
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{label}</span>
                      {isBlocked ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
