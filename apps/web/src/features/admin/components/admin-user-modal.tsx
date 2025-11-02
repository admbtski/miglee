// components/admin/admin-user-modal.tsx
'use client';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  IntentMemberCoreFragment_IntentMember_user_User,
  Role,
  SortDir,
  UsersSortBy,
} from '@/lib/api/__generated__/react-query-update';
import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Mail,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShieldQuestion,
  User2,
  UserCog,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

export type UsersQueryVars = {
  limit: number;
  offset: number;
  q?: string | null;
  role?: Role | null;
  verifiedOnly?: boolean | null;
  sort?: { by: UsersSortBy; dir: SortDir } | null;
};

const timeAgo = (v?: string | Date | null) => {
  if (!v) return '—';
  const delta = Date.now() - new Date(v).getTime();
  const m = Math.max(1, Math.round(delta / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
};
const fmtDate = (v?: string | Date | null) =>
  v ? new Date(v).toLocaleString() : '—';

export function AdminUsersModal({
  open,
  onClose,
  users,
  total,
  loading = false,
  onRefresh,
  query,
  onChangeQuery,
}: {
  open: boolean;
  onClose: () => void;
  users: IntentMemberCoreFragment_IntentMember_user_User[];
  total: number;
  loading?: boolean;
  onRefresh?: () => void | Promise<void>;
  query: UsersQueryVars;
  onChangeQuery: (v: Partial<UsersQueryVars>) => void;
}) {
  const prefersReduced = useReducedMotion();
  const frameRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!frameRef.current?.contains(t)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => users.find((u) => u.id === selectedId) ?? null,
    [users, selectedId]
  );

  // Role dropdown options (includes synthetic "ALL")
  const roleOptions = useMemo(() => {
    const set = new Set<string>(['ALL', Role.Admin, Role.Moderator, Role.User]);
    return Array.from(set);
  }, []);

  // Pagination helpers
  const canPrev = query.offset > 0;
  const canNext = query.offset + query.limit < total;
  const currentPage = Math.floor(query.offset / query.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  /** Debounced search with minimum length (3) */
  const [qInput, setQInput] = useState(query.q ?? '');
  const debouncedQ = useDebouncedValue(qInput, 300);

  // Keep local input in sync with external query
  useEffect(() => {
    const ext = query.q ?? '';
    if (ext !== qInput) setQInput(ext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.q]);

  // Push debounced query up (null if empty or <3 chars)
  useEffect(() => {
    const trimmed = debouncedQ.trim();
    const nextQ =
      trimmed.length === 0 ? null : trimmed.length >= 3 ? trimmed : null;

    if ((query.q ?? null) !== nextQ) {
      onChangeQuery({ q: nextQ, offset: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  // Filter/sort/limit/pagination helpers
  const setRole = (role: string) =>
    onChangeQuery({ role: role === 'ALL' ? null : (role as Role), offset: 0 });
  const toggleVerified = () =>
    onChangeQuery({
      verifiedOnly: query.verifiedOnly ? null : true,
      offset: 0,
    });
  const setSort = (txt: string) => {
    const [by, dir] = txt.split(' ') as [UsersSortBy, SortDir];
    onChangeQuery({ sort: { by, dir }, offset: 0 });
  };
  const setLimit = (v: string) =>
    onChangeQuery({
      limit: parseInt(v, 10),
      offset: 0,
    });
  const prevPage = () =>
    canPrev &&
    onChangeQuery({ offset: Math.max(0, query.offset - query.limit) });
  const nextPage = () =>
    canNext && onChangeQuery({ offset: query.offset + query.limit });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: prefersReduced ? 0 : 1 }}
        >
          <motion.div
            ref={frameRef}
            className="grid w-[96vw] max-w-6xl grid-rows-[auto_1fr] overflow-hidden rounded-3xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            initial={{ y: 24, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.98, opacity: 0 }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { type: 'spring', duration: 0.5, bounce: 0.28 }
            }
          >
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="grid text-white bg-indigo-600 h-9 w-9 place-items-center rounded-xl">
                  <UserCog className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">Users</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Total: {total} · page {currentPage} of {totalPages}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRefresh?.()}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Refreshing…
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="w-4 h-4" />
                      Refresh
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body (left list + right details) */}
            <div className="grid h-[75vh] min-h-0 grid-cols-1 gap-0 border-t border-zinc-200 dark:border-zinc-800 md:grid-cols-[1.7fr_1px_1fr]">
              {/* LEFT: toolbar + table + pagination */}
              <div className="flex flex-col min-w-0 min-h-0">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-white border-b border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 sm:p-4">
                  {/* Search (debounced, min 3 chars) */}
                  <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                    <Search className="w-4 h-4 opacity-60" />
                    <input
                      value={qInput}
                      onChange={(e) => setQInput(e.target.value)}
                      placeholder="Search by name or email…"
                      className="w-full text-sm bg-transparent outline-none placeholder:text-zinc-400"
                    />
                    {qInput.trim().length > 0 &&
                      qInput.trim().length < 3 &&
                      !loading && (
                        <span className="shrink-0 text-[11px] text-zinc-500">
                          Min 3 chars
                        </span>
                      )}
                    {loading && (
                      <Loader2 className="w-4 h-4 animate-spin opacity-70" />
                    )}
                  </div>

                  {/* Role filter */}
                  <Dropdown
                    label={query.role ? `Role: ${query.role}` : 'Role: All'}
                    items={roleOptions}
                    onPick={setRole}
                  />

                  {/* Verified toggle */}
                  <button
                    type="button"
                    onClick={toggleVerified}
                    className={clsx(
                      'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                      query.verifiedOnly
                        ? 'border-emerald-300/40 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300'
                        : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900'
                    )}
                  >
                    <BadgeCheck className="w-4 h-4" />
                    Verified only
                  </button>

                  {/* Sort */}
                  <Dropdown
                    label={`Sort: ${query.sort?.by ?? '—'} ${query.sort?.dir ?? ''}`}
                    items={[
                      'NAME ASC',
                      'NAME DESC',
                      'ROLE ASC',
                      'ROLE DESC',
                      'CREATED_AT ASC',
                      'CREATED_AT DESC',
                      'VERIFIED_AT ASC',
                      'VERIFIED_AT DESC',
                    ]}
                    onPick={setSort}
                  />

                  {/* Page size */}
                  <Dropdown
                    label={`Page: ${query.limit}`}
                    items={['10', '25', '50', '100']}
                    onPick={setLimit}
                  />
                </div>

                {/* Polished TABLE */}
                <div className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
                  <div className="mx-3 my-3 bg-white border shadow-sm rounded-2xl border-zinc-200 ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className=" rounded-2xl">
                      <table className="min-w-full table-fixed">
                        {/* Colgroup keeps columns aligned and prevents wobble */}
                        <colgroup>
                          <col className="w-auto" /> {/* Name */}
                          <col className="hidden w-64 lg:table-column" />{' '}
                          {/* Email */}
                          <col className="w-36" /> {/* Role */}
                          <col className="hidden md:table-column w-44" />{' '}
                          {/* Created */}
                          <col className="w-36" /> {/* Verified */}
                        </colgroup>

                        <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 shadow-[inset_0_-1px_0_rgba(0,0,0,0.02)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
                            <th
                              scope="col"
                              className="py-3.5 pr-3 pl-4 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300 sm:pl-5"
                            >
                              Name
                            </th>

                            <th className="hidden px-3 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300 sm:table-cell">
                              Email
                            </th>
                            <th className="px-3 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                              Role
                            </th>
                            <th className="hidden px-3 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300 md:table-cell">
                              Created
                            </th>
                            <th className="py-3.5 pr-4 pl-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300 sm:pr-5">
                              Verified
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                          {loading ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-16 text-sm text-center text-zinc-500"
                              >
                                <span className="inline-flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Loading users…
                                </span>
                              </td>
                            </tr>
                          ) : users.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-16 text-sm text-center text-zinc-500"
                              >
                                {qInput.trim().length > 0 &&
                                qInput.trim().length < 3
                                  ? 'Type at least 3 characters to search'
                                  : 'No users match current filters'}
                              </td>
                            </tr>
                          ) : (
                            users.map((u, i) => (
                              <tr
                                key={u.id}
                                onClick={() => setSelectedId(u.id)}
                                className={clsx(
                                  // Zebra stripes for subtle row separation
                                  i % 2 === 1
                                    ? 'bg-zinc-50/60 dark:bg-zinc-900/20'
                                    : '',
                                  // Hover + selected state
                                  'cursor-pointer transition-colors hover:bg-indigo-50/70 dark:hover:bg-indigo-900/20',
                                  selectedId === u.id &&
                                    'bg-indigo-50 dark:bg-indigo-900/25'
                                )}
                              >
                                {/* Name + stacked mobile details */}
                                <td className="w-full max-w-0 py-3.5 pr-3 pl-4 text-sm font-medium text-zinc-900 dark:text-zinc-50 sm:w-auto sm:max-w-none sm:pl-5">
                                  <div className="flex items-center min-w-0 gap-3">
                                    <img
                                      src={u.imageUrl}
                                      alt=""
                                      className="object-cover rounded-full h-9 w-9 shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700"
                                    />
                                    <span className="truncate">
                                      {u.name || '—'}
                                    </span>
                                  </div>

                                  {/* Stacked details on small screens */}
                                  <dl className="font-normal lg:hidden">
                                    <dt className="sr-only sm:hidden">Email</dt>
                                    <dd className="mt-1 text-xs truncate text-zinc-500 sm:hidden">
                                      {u.email ?? '—'}
                                    </dd>
                                  </dl>
                                </td>

                                {/* Email (sm+) */}
                                <td className="hidden px-3 py-3.5 text-sm text-zinc-600 dark:text-zinc-300 sm:table-cell">
                                  <span className="inline-flex items-center gap-2">
                                    <Mail className="w-4 h-4 opacity-60" />
                                    <span className="truncate">
                                      {u.email ?? '—'}
                                    </span>
                                    {u.email && (
                                      <IconButton
                                        label="Copy email"
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            u.email!
                                          );
                                        }}
                                      >
                                        <Copy className="w-4 h-4" />
                                      </IconButton>
                                    )}
                                  </span>
                                </td>

                                {/* Role */}
                                <td className="px-3 py-3.5 text-sm">
                                  <RoleBadge role={u.role} />
                                </td>

                                {/* Created (md+) */}
                                <td className="hidden px-3 py-3.5 text-sm text-zinc-600 dark:text-zinc-400 md:table-cell">
                                  <span className="font-mono tabular-nums">
                                    {fmtDate(u.createdAt)}
                                  </span>
                                </td>

                                {/* Verified */}
                                <td className="py-3.5 pr-4 pl-3 text-sm sm:pr-5">
                                  {u.verifiedAt ? (
                                    <Badge
                                      tone="success"
                                      icon={
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                      }
                                    >
                                      Verified
                                    </Badge>
                                  ) : (
                                    <Badge
                                      tone="neutral"
                                      icon={
                                        <ShieldQuestion className="h-3.5 w-3.5" />
                                      }
                                    >
                                      Unverified
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm border-t border-zinc-200 dark:border-zinc-800 sm:px-4">
                  <div className="text-xs text-zinc-500">
                    Total {total} · Page {currentPage}/{totalPages} · Offset{' '}
                    {query.offset} · Limit {query.limit}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={prevPage}
                      disabled={!canPrev || loading}
                      className={clsx(
                        'inline-flex items-center gap-2 rounded-xl border px-3 py-2',
                        'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900',
                        (!canPrev || loading) && 'opacity-50'
                      )}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={nextPage}
                      disabled={!canNext || loading}
                      className={clsx(
                        'inline-flex items-center gap-2 rounded-xl border px-3 py-2',
                        'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900',
                        (!canNext || loading) && 'opacity-50'
                      )}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden w-px h-full bg-zinc-200 dark:bg-zinc-800 md:block" />

              {/* RIGHT: details (desktop) */}
              <div className="hidden min-w-0 min-h-0 p-4 md:block">
                <div className="h-full min-h-0 overflow-auto [scrollbar-gutter:stable]">
                  {!selected ? (
                    <div className="grid h-full text-sm place-items-center text-zinc-500">
                      Select a user to see details
                    </div>
                  ) : (
                    <UserDetailsCard u={selected} />
                  )}
                </div>
              </div>

              {/* Mobile details overlay */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    className="fixed inset-0 z-[75] grid grid-rows-[auto_1fr] bg-white dark:bg-zinc-950 md:hidden"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'tween', duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setSelectedId(null)}
                        className="grid h-9 w-9 place-items-center rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        aria-label="Back"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-base font-semibold">User details</h3>
                    </div>
                    <div className="min-h-0 overflow-auto p-4 [scrollbar-gutter:stable]">
                      <UserDetailsCard u={selected} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ UI pieces ------------------------------ */

function Badge({
  children,
  tone,
  icon,
}: {
  children: React.ReactNode;
  tone: 'success' | 'neutral';
  icon?: React.ReactNode;
}) {
  const cls =
    tone === 'success'
      ? 'bg-emerald-100 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-900/30 dark:text-emerald-300'
      : 'bg-zinc-100 text-zinc-700 ring-zinc-600/10 dark:bg-zinc-800 dark:text-zinc-300';
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1',
        cls
      )}
    >
      {icon}
      {children}
    </span>
  );
}

function RoleBadge({ role }: { role?: string | null }) {
  const r = (role ?? '').toUpperCase();
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
      {r || 'USER'}
    </span>
  );
}

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid rounded-lg h-7 w-7 place-items-center text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </button>
  );
}

function Dropdown({
  label,
  items,
  onPick,
}: {
  label: string;
  items: string[];
  onPick: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside / Esc
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        {label}
        <ChevronDown className="w-4 h-4 opacity-70" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-50 w-48 p-1 mt-2 bg-white border shadow-2xl rounded-2xl border-zinc-200 ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-900"
            role="menu"
          >
            {items.map((it) => (
              <button
                key={it}
                role="menuitem"
                onClick={() => {
                  onPick(it);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-sm text-left cursor-pointer select-none rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {it}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Right-side details card */
function UserDetailsCard({
  u,
}: {
  u: IntentMemberCoreFragment_IntentMember_user_User;
}) {
  const row = (label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3 sm:grid-cols-[160px_1fr]">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="min-w-0 text-sm truncate text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-4 p-4 border rounded-2xl border-zinc-200 dark:border-zinc-800">
        <img
          src={u.imageUrl}
          alt=""
          className="object-cover w-16 h-16 rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-700"
        />
        <div className="min-w-0">
          <div className="text-lg font-semibold truncate">{u.name || '—'}</div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <RoleBadge role={u.role} />
            {u.verifiedAt ? (
              <Badge
                tone="success"
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
              >
                Verified
              </Badge>
            ) : (
              <Badge
                tone="neutral"
                icon={<ShieldQuestion className="h-3.5 w-3.5" />}
              >
                Unverified
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 border rounded-2xl border-zinc-200 dark:border-zinc-800">
        {row(
          'Email',
          u.email ? (
            <span className="inline-flex items-center gap-2">
              <Mail className="w-4 h-4 opacity-60" />
              <span className="truncate">{u.email}</span>
              <IconButton
                label="Copy email"
                onClick={() => navigator.clipboard.writeText(u.email!)}
              >
                <Copy className="w-4 h-4" />
              </IconButton>
            </span>
          ) : (
            '—'
          )
        )}
        {row(
          'Name',
          u.name ? (
            <span className="inline-flex items-center gap-2">
              <User2 className="w-4 h-4 opacity-60" />
              <span className="truncate">{u.name}</span>
            </span>
          ) : (
            '—'
          )
        )}
        {row('User ID', <code className="text-xs">{u.id}</code>)}
        {row(
          'Created at',
          <span className="font-mono tabular-nums">{fmtDate(u.createdAt)}</span>
        )}
        {row(
          'Verified at',
          u.verifiedAt ? (
            <span className="font-mono tabular-nums">
              {fmtDate(u.verifiedAt)}
            </span>
          ) : (
            '—'
          )
        )}
        {row('Last seen', timeAgo(u.lastSeenAt))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 mt-auto">
        <button
          type="button"
          className="px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          onClick={() => navigator.clipboard.writeText(u.id)}
        >
          Copy user ID
        </button>
        <button
          type="button"
          className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-500"
          onClick={() => console.log('Impersonate', u.id)}
        >
          Impersonate (dev)
        </button>
      </div>
    </div>
  );
}
