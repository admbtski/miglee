/**
 * Intent Members Management Component
 * List and manage event members
 */

'use client';

import { useState } from 'react';
import { Users, Search, Filter, UserPlus } from 'lucide-react';

import { useIntentMembersQuery } from '@/lib/api/intent-members';
import { cn } from '@/lib/utils';

interface IntentMembersManagementProps {
  intentId: string;
}

type MemberFilter = 'all' | 'owner' | 'moderator' | 'participant';

/**
 * Intent Members Management Component
 */
export function IntentMembersManagement({
  intentId,
}: IntentMembersManagementProps) {
  const [filter, setFilter] = useState<MemberFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useIntentMembersQuery({
    intentId,
    limit: 100,
  });

  const members = data?.intentMembers || [];

  // Filter members based on role
  const filteredMembers = members.filter((member) => {
    if (filter !== 'all' && member.role?.toLowerCase() !== filter) {
      return false;
    }
    if (
      searchQuery &&
      !member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const filters: { id: MemberFilter; label: string }[] = [
    { id: 'all', label: 'All Members' },
    { id: 'owner', label: 'Owners' },
    { id: 'moderator', label: 'Moderators' },
    { id: 'participant', label: 'Participants' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Members
          </h1>
          <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
            Manage event members and their roles
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
          <UserPlus className="h-4 w-4" />
          Invite Members
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                filter === f.id
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 sm:w-64"
          />
        </div>
      </div>

      {/* Members List */}
      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading members...
            </p>
          </div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-zinc-400" />
            <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              No members found
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Try adjusting your filters
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                          {member.user?.avatar ? (
                            <img
                              src={member.user.avatar}
                              alt={member.user.name || 'User'}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {member.user?.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {member.user?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            @{member.user?.username || 'unknown'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                          member.role === 'OWNER' &&
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400',
                          member.role === 'MODERATOR' &&
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
                          member.role === 'PARTICIPANT' &&
                            'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                        )}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/50 dark:text-green-400">
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {member.joinedAt
                        ? new Date(member.joinedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Total Members
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {members.length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Moderators
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {members.filter((m) => m.role === 'MODERATOR').length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Participants
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {members.filter((m) => m.role === 'PARTICIPANT').length}
          </p>
        </div>
      </div>
    </div>
  );
}
