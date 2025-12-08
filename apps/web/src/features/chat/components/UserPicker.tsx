'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, User2, AlertCircle } from 'lucide-react';
import { useUsersQuery } from '@/features/users/api/users';
import { useMeQuery } from '@/features/auth/hooks/auth';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { buildAvatarUrl } from '@/lib/media/url';
import { BlurHashImage } from '@/components/ui/blurhash-image';

export type PickedUser = {
  id: string;
  name: string;
  avatarKey?: string | null;
  avatarBlurhash?: string | null;
};

type UserPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: PickedUser) => void;
  excludeUserIds?: string[];
};

/**
 * UserPicker - Modal for selecting a user to start a DM conversation
 *
 * Features:
 * - Search users by name
 * - Exclude current user and blocked users
 * - Show loading and error states
 * - Keyboard navigation (ESC to close)
 */
export function UserPicker({
  isOpen,
  onClose,
  onSelectUser,
  excludeUserIds = [],
}: UserPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: meData } = useMeQuery();
  const currentUserId = meData?.me?.id;

  // Fetch users with search query
  const {
    data: usersData,
    isLoading,
    error,
  } = useUsersQuery(
    {
      q: debouncedQuery || undefined,
      limit: 50,
      offset: 0,
      verifiedOnly: false,
    },
    {
      enabled: isOpen,
    }
  );

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const users = usersData?.users?.items || [];

  // Filter out current user and excluded users
  const filteredUsers = users.filter((user) => {
    if (user.id === currentUserId) return false;
    if (excludeUserIds.includes(user.id)) return false;
    return true;
  });

  const handleSelectUser = (user: PickedUser) => {
    onSelectUser(user);
    setSearchQuery('');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl pointer-events-auto dark:bg-zinc-900 ring-1 ring-black/10 dark:ring-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold">Start a conversation</h2>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-8 h-8 transition-colors rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name..."
                className="w-full py-3 pl-10 pr-4 text-sm border rounded-xl border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Failed to load users. Please try again.
                </p>
              </div>
            )}

            {!isLoading && !error && filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <User2 className="w-8 h-8 text-zinc-400" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {searchQuery
                    ? 'No users found matching your search.'
                    : 'No users available.'}
                </p>
              </div>
            )}

            {!isLoading && !error && filteredUsers.length > 0 && (
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() =>
                      handleSelectUser({
                        id: user.id,
                        name: user.name,
                        avatarKey: user.avatarKey,
                        avatarBlurhash: user.avatarBlurhash,
                      })
                    }
                    className="flex items-center w-full gap-3 p-3 text-left transition-colors rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {/* Avatar */}
                    {user.avatarKey ? (
                      <BlurHashImage
                        src={buildAvatarUrl(user.avatarKey, 'sm') || ''}
                        blurhash={user.avatarBlurhash}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="object-cover w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-white bg-indigo-600 rounded-full">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.name}</div>
                      {user.email && (
                        <div className="text-xs truncate text-zinc-500 dark:text-zinc-400">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
              Select a user to start a private conversation
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
