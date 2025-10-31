'use client';

import * as React from 'react';
import {
  Mail,
  AtSign,
  ShieldCheck,
  ShieldQuestion,
  MoreHorizontal,
} from 'lucide-react';
import clsx from 'clsx';

export type AdminUser = {
  id: string;
  name: string;
  email: string | null;
  role?: string | null;
  username?: string | null;
  createdAt?: string | Date | null;
  verifiedAt?: string | Date | null;
};

function fmtDate(v?: string | Date | null) {
  return v ? new Date(v).toLocaleString() : '—';
}

export function AdminUsersTable({
  users,
  loading,
  onRowClick,
  onEdit,
  className,
}: {
  users: AdminUser[];
  loading?: boolean;
  onRowClick?: (u: AdminUser) => void;
  onEdit?: (u: AdminUser) => void;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        // scrollable container with sticky header support
        'min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable] rounded-xl',
        'ring-1 ring-black/5 dark:ring-white/10',
        className
      )}
    >
      <table className="min-w-full border-separate border-spacing-0">
        {/* Sticky header */}
        <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
          <tr className="text-sm font-semibold text-left border-b border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
            <th scope="col" className="py-3.5 pr-3 pl-4 sm:pl-5">
              Name
            </th>
            <th scope="col" className="hidden px-3 py-3.5 lg:table-cell">
              Username
            </th>
            <th scope="col" className="hidden px-3 py-3.5 sm:table-cell">
              Email
            </th>
            <th scope="col" className="px-3 py-3.5">
              Role
            </th>
            <th scope="col" className="hidden px-3 py-3.5 md:table-cell">
              Created
            </th>
            <th scope="col" className="px-3 py-3.5">
              Verified
            </th>
            <th scope="col" className="py-3.5 pr-4 pl-3 text-right sm:pr-5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody className="text-sm bg-white divide-y divide-zinc-200 dark:divide-zinc-800 dark:bg-zinc-950">
          {loading ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-zinc-500">
                Loading users…
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-zinc-500">
                No users match current filters
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr
                key={u.id}
                className={clsx(
                  'hover:bg-zinc-50 dark:hover:bg-zinc-900/40',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(u)}
              >
                {/* Name (mobile shows stacked details below) */}
                <td className="w-full py-4 pl-4 pr-3 font-medium max-w-0 text-zinc-900 sm:w-auto sm:max-w-none sm:pl-5 dark:text-zinc-50">
                  {u.name || '—'}
                  <dl className="font-normal lg:hidden">
                    {/* Username (mobile extra) */}
                    {u.username && (
                      <>
                        <dt className="sr-only">Username</dt>
                        <dd className="flex items-center gap-1 mt-1 truncate text-zinc-500">
                          <AtSign className="h-3.5 w-3.5 opacity-70" />
                          {u.username}
                        </dd>
                      </>
                    )}
                    {/* Email (mobile only under name) */}
                    {u.email && (
                      <>
                        <dt className="sr-only sm:hidden">Email</dt>
                        <dd className="flex items-center gap-1 mt-1 truncate text-zinc-600 sm:hidden dark:text-zinc-400">
                          <Mail className="h-3.5 w-3.5 opacity-70" />
                          {u.email}
                        </dd>
                      </>
                    )}
                  </dl>
                </td>

                {/* Username (desktop lg+) */}
                <td className="hidden px-3 py-4 text-zinc-500 lg:table-cell">
                  {u.username ? (
                    <span className="inline-flex items-center gap-1">
                      <AtSign className="h-3.5 w-3.5 opacity-70" />
                      {u.username}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>

                {/* Email (>= sm) */}
                <td className="hidden px-3 py-4 text-zinc-600 sm:table-cell dark:text-zinc-400">
                  {u.email ? (
                    <span className="inline-flex items-center gap-1 truncate">
                      <Mail className="w-4 h-4 opacity-60" />
                      {u.email}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>

                {/* Role */}
                <td className="px-3 py-4 text-zinc-600 dark:text-zinc-300">
                  <RoleBadge role={u.role} />
                </td>

                {/* Created (>= md) */}
                <td className="hidden px-3 py-4 font-mono tabular-nums text-zinc-600 md:table-cell dark:text-zinc-400">
                  {fmtDate(u.createdAt)}
                </td>

                {/* Verified */}
                <td className="px-3 py-4">
                  {u.verifiedAt ? <VerifiedBadge ok /> : <VerifiedBadge />}
                </td>

                {/* Actions */}
                <td
                  className="py-4 pl-3 pr-4 text-right sm:pr-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onEdit?.(u)}
                    className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                    aria-label={`Edit ${u.name ?? u.id}`}
                    title={`Edit ${u.name ?? u.id}`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    Edit
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ===== Small UI bits ===== */

function RoleBadge({ role }: { role?: string | null }) {
  const r = (role ?? 'USER').toUpperCase();
  const style =
    r === 'ADMIN'
      ? 'bg-rose-100 text-rose-700 ring-rose-600/15 dark:bg-rose-900/30 dark:text-rose-300'
      : r === 'MODERATOR'
        ? 'bg-amber-100 text-amber-800 ring-amber-700/15 dark:bg-amber-900/30 dark:text-amber-300'
        : 'bg-zinc-100 text-zinc-700 ring-zinc-600/10 dark:bg-zinc-800 dark:text-zinc-300';
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1',
        style
      )}
    >
      {r}
    </span>
  );
}

function VerifiedBadge({ ok = false }: { ok?: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/15 dark:bg-emerald-900/30 dark:text-emerald-300">
      <ShieldCheck className="h-3.5 w-3.5" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-600/10 dark:bg-zinc-800 dark:text-zinc-300">
      <ShieldQuestion className="h-3.5 w-3.5" />
      Unverified
    </span>
  );
}
