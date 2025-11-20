'use client';

import { Check, ChevronDown, Loader2, Search, UserPlus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Modal } from '@/components/feedback/modal';
import { useInviteMemberMutation } from '@/lib/api/intent-members';
import { useUsersQuery } from '@/lib/api/users';
import clsx from 'clsx';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar as AvatarComponent } from '@/components/ui/avatar';

/* ---------------------------------- TYPES ---------------------------------- */

type UserItem = {
  id: string;
  name: string;
  avatarKey?: string | null;
  avatarBlurhash?: string | null;
  email?: string | null;
};

export type InviteUsersModalProps = {
  open: boolean;
  onClose: () => void;
  intentId: string;
  suggestions?: Array<UserItem>;
  onInvited?: (invitedUserIds: string[]) => void;
};

/* ---------------------------------- UI PARTS ---------------------------------- */

function Avatar({
  user,
  size = 32,
}: {
  user: {
    name: string;
    avatarKey?: string | null;
    avatarBlurhash?: string | null;
  };
  size?: number;
}) {
  return (
    <AvatarComponent
      url={buildAvatarUrl(user.avatarKey, 'xs')}
      blurhash={user.avatarBlurhash}
      alt={user.name}
      size={size}
    />
  );
}

function Chip({
  user,
  onRemove,
}: {
  user: {
    id: string;
    name: string;
    avatarKey?: string | null;
    avatarBlurhash?: string | null;
  };
  onRemove: (id: string) => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900">
      <Avatar user={user} size={20} />
      <span className="max-w-[160px] truncate">{user.name || '—'}</span>
      <button
        type="button"
        onClick={() => onRemove(user.id)}
        className="grid h-5 w-5 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        aria-label="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

/* ---------------------------------- MODAL ---------------------------------- */

export function InviteUsersModal({
  open,
  onClose,
  intentId,
  suggestions = [],
  onInvited,
}: InviteUsersModalProps) {
  /* ------------------------------ STATE ------------------------------ */
  const [q, setQ] = useState('');
  const limit = 10; // TODO: make this configurable
  const [offset, setOffset] = useState(0);

  const [debounced, setDebounced] = useState(q);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data, isLoading, isFetching, refetch } = useUsersQuery(
    {
      limit,
      offset,
      q: debounced.trim().length >= 2 ? debounced.trim() : null,
    },
    { enabled: open }
  );

  const users = data?.users.items ?? [];
  const total = data?.users.pageInfo.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const [selected, setSelected] = useState<Record<string, UserItem>>({});
  const selectedList = useMemo(() => Object.values(selected), [selected]);

  const togglePick = (u: UserItem) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[u.id]) delete next[u.id];
      else next[u.id] = u;
      return next;
    });

  const removePick = (id: string) =>
    setSelected((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  useEffect(() => {
    if (!open) {
      setSelected({});
      setQ('');
      setOffset(0);
    }
  }, [open]);

  const inviteOne = useInviteMemberMutation();
  const [inviting, setInviting] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleInvite() {
    const ids = selectedList.map((u) => u.id);
    if (ids.length === 0) return;

    setInviting(true);
    setProgress(0);

    const results = await Promise.allSettled(
      ids.map(async (userId, idx) => {
        const res = await inviteOne.mutateAsync({
          input: { intentId, userId },
        });
        setProgress(Math.round(((idx + 1) / ids.length) * 100));
        return res;
      })
    );

    const okIds: string[] = [];
    const failed: Array<{ id: string; reason?: any }> = [];

    results.forEach((r, i) => {
      const id = ids[i];
      if (!id) return;
      if (r.status === 'fulfilled') okIds.push(id);
      else failed.push({ id, reason: r.reason });
    });

    onInvited?.(okIds);
    setInviting(false);
    if (failed.length === 0) onClose();
  }

  /* ------------------------------ HEADER ------------------------------ */

  const Header = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
          <UserPlus className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Invite attendees</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Pick multiple users and send invitations
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="grid h-9 w-9 place-items-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  /* ------------------------------ CONTENT ------------------------------ */

  const Content = (
    <div className="flex flex-col">
      {/* Search input */}
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
        <Search className="h-4 w-4 opacity-60" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOffset(0);
          }}
          placeholder="Search by name or email…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
        />
        {(isLoading || isFetching) && (
          <Loader2 className="h-4 w-4 animate-spin opacity-70" />
        )}
      </div>

      {/* Scrollable list (z sticky paginacją w środku) */}
      <div className="relative rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="max-h-[54vh] overflow-y-auto [scrollbar-gutter:stable]">
          {users.length === 0 ? (
            <div className="grid h-full place-items-center p-10 text-sm text-zinc-500">
              {debounced.trim().length < 2
                ? 'Type at least 2 characters to search'
                : 'No users found'}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {users.map((u) => {
                  const picked = !!selected[u.id];
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => togglePick(u as UserItem)}
                        className={clsx(
                          'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors',
                          'hover:bg-zinc-50 dark:hover:bg-zinc-900/50',
                          picked && 'bg-indigo-50/60 dark:bg-indigo-900/20'
                        )}
                      >
                        <Avatar user={u} size={40} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {u.name || '—'}
                          </div>
                          <div className="truncate text-xs text-zinc-500">
                            {u.email ?? '—'}
                          </div>
                        </div>
                        <span
                          className={clsx(
                            'grid h-7 w-7 place-items-center rounded-full border',
                            picked
                              ? 'border-indigo-300 bg-indigo-600 text-white'
                              : 'border-zinc-300 bg-white text-transparent dark:bg-zinc-900'
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Sticky pagination */}
              <div className="sticky bottom-0 border-t border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/90">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="hidden sm:block text-xs text-zinc-500">
                    Total {total} · Offset {offset} · Limit {limit}
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        canPrev && setOffset(Math.max(0, offset - limit))
                      }
                      disabled={!canPrev || isLoading || isFetching}
                      className={clsx(
                        'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5',
                        'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900',
                        (!canPrev || isLoading || isFetching) && 'opacity-50'
                      )}
                    >
                      ‹ Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => canNext && setOffset(offset + limit)}
                      disabled={!canNext || isLoading || isFetching}
                      className={clsx(
                        'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5',
                        'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900',
                        (!canNext || isLoading || isFetching) && 'opacity-50'
                      )}
                    >
                      Next ›
                    </button>
                    <div className="relative hidden sm:block">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                      >
                        Page: {limit}
                        <ChevronDown className="h-4 w-4 opacity-70" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ▼▼▼ PRZENIESIONE TUTAJ: WYBRANI UŻYTKOWNICY (POD LISTĄ) ▼▼▼ */}
      {selectedList.length > 0 && (
        <div className="mt-3">
          <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Selected ({selectedList.length})
          </div>
          <div className="max-h-24 overflow-auto [scrollbar-gutter:stable] rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              {selectedList.map((u) => (
                <Chip key={u.id} user={u} onRemove={removePick} />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ▲▲▲ KONIEC BLOKU Z CHIPAMI ▲▲▲ */}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-sm font-medium">Suggested attendees</div>
          <div className="flex flex-wrap items-center gap-3">
            {suggestions.map((u) => {
              const picked = !!selected[u.id];
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => togglePick(u as UserItem)}
                  className={clsx(
                    'relative grid place-items-center rounded-full p-0.5 ring-1 ring-zinc-200 hover:ring-indigo-400 dark:ring-zinc-700'
                  )}
                  title={u.name || u.email || ''}
                >
                  <Avatar user={u} size={44} />
                  <span
                    className={clsx(
                      'absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border',
                      picked
                        ? 'border-indigo-300 bg-indigo-600 text-white'
                        : 'border-zinc-300 bg-white text-transparent dark:bg-zinc-900'
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  /* ------------------------------ FOOTER ------------------------------ */

  const Footer = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900 sm:w-auto"
        >
          {isFetching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Refresh
            </>
          ) : (
            'Refresh'
          )}
        </button>
        <button
          type="button"
          onClick={handleInvite}
          disabled={inviting || selectedList.length === 0}
          className={clsx(
            'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 sm:w-auto',
            (inviting || selectedList.length === 0) && 'opacity-60'
          )}
        >
          {inviting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending… {progress}%
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" /> Send invitations
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      density="comfortable"
      ariaLabel="Invite users to the event"
      header={Header}
      content={Content}
      footer={Footer}
    />
  );
}
