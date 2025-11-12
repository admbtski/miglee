'use client';

import { useState } from 'react';
import {
  useMyMembershipsQuery,
  useAcceptInviteMutation,
  useCancelJoinRequestMutation,
} from '@/lib/api/intent-members';
import type {
  IntentMemberStatus,
  IntentMemberRole,
} from '@/lib/api/__generated__/react-query';
import { Calendar, Users, MapPin, Clock, Filter, Check, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const STATUS_LABELS: Record<IntentMemberStatus, string> = {
  JOINED: 'Joined',
  PENDING: 'Pending',
  INVITED: 'Invited',
  REJECTED: 'Rejected',
  BANNED: 'Banned',
  LEFT: 'Left',
  KICKED: 'Kicked',
};

const STATUS_COLORS: Record<IntentMemberStatus, string> = {
  JOINED:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  PENDING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  INVITED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  BANNED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  LEFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  KICKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const ROLE_LABELS: Record<IntentMemberRole, string> = {
  OWNER: 'Owner',
  MODERATOR: 'Moderator',
  MEMBER: 'Member',
};

const ROLE_COLORS: Record<IntentMemberRole, string> = {
  OWNER:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  MODERATOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  MEMBER: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export default function MembershipsPage() {
  const [statusFilter, setStatusFilter] = useState<IntentMemberStatus | null>(
    null
  );
  const [roleFilter, setRoleFilter] = useState<IntentMemberRole | null>(null);

  const { data, isLoading, error } = useMyMembershipsQuery({
    status: statusFilter ?? undefined,
    role: roleFilter ?? undefined,
    limit: 100,
  });

  const acceptInvite = useAcceptInviteMutation();
  const cancelRequest = useCancelJoinRequestMutation();

  const memberships = data?.myMemberships ?? [];

  const handleAcceptInvite = (intentId: string) => {
    acceptInvite.mutate({ intentId });
  };

  const handleCancelRequest = (intentId: string) => {
    cancelRequest.mutate({ intentId });
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          My Memberships
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          View and manage your event memberships
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <select
            value={statusFilter ?? ''}
            onChange={(e) =>
              setStatusFilter(
                e.target.value ? (e.target.value as IntentMemberStatus) : null
              )
            }
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors hover:border-zinc-300 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-500" />
          <select
            value={roleFilter ?? ''}
            onChange={(e) =>
              setRoleFilter(
                e.target.value ? (e.target.value as IntentMemberRole) : null
              )
            }
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors hover:border-zinc-300 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700"
          >
            <option value="">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {(statusFilter || roleFilter) && (
          <button
            onClick={() => {
              setStatusFilter(null);
              setRoleFilter(null);
            }}
            className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          <p className="font-medium">Error loading memberships</p>
          <p className="mt-1 text-sm">{String(error)}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && memberships.length === 0 && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <Calendar className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            No memberships found
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {statusFilter || roleFilter
              ? 'Try adjusting your filters'
              : 'Join or create an event to get started'}
          </p>
          {!statusFilter && !roleFilter && (
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700"
            >
              <Calendar className="h-4 w-4" />
              Browse Events
            </Link>
          )}
        </div>
      )}

      {/* Memberships List */}
      {!isLoading && !error && memberships.length > 0 && (
        <div className="space-y-4">
          {memberships.map((membership) => {
            const intent = (membership as any).intent;
            if (!intent) return null;

            return (
              <div
                key={membership.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 transition-all dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Event Info */}
                  <Link
                    href={`/intent/${intent.id}`}
                    className="flex-1 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {intent.title}
                      </h3>
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[membership.status]}`}
                      >
                        {STATUS_LABELS[membership.status]}
                      </span>
                      {/* Role Badge */}
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[membership.role]}`}
                      >
                        {ROLE_LABELS[membership.role]}
                      </span>
                    </div>

                    {intent.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                        {intent.description}
                      </p>
                    )}

                    {/* Event Details */}
                    <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {/* Date */}
                      {intent.startAt && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(intent.startAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}

                      {/* Location */}
                      {intent.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{intent.address}</span>
                        </div>
                      )}

                      {/* Members Count */}
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>
                          {intent.joinedCount ?? 0} / {intent.max ?? '∞'}
                        </span>
                      </div>
                    </div>

                    {/* Joined Date */}
                    {membership.joinedAt && (
                      <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                        Joined on{' '}
                        {format(new Date(membership.joinedAt), 'MMM d, yyyy')}
                      </div>
                    )}
                  </Link>

                  {/* Right: Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {/* Accept Invite Button (for INVITED status) */}
                    {membership.status === 'INVITED' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAcceptInvite(intent.id);
                        }}
                        disabled={acceptInvite.isPending}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Accept invitation"
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </button>
                    )}

                    {/* Cancel Request Button (for PENDING status) */}
                    {membership.status === 'PENDING' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleCancelRequest(intent.id);
                        }}
                        disabled={cancelRequest.isPending}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Cancel join request"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && !error && memberships.length > 0 && (
        <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Showing {memberships.length} membership
          {memberships.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
