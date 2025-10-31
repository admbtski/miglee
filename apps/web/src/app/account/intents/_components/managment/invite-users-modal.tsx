'use client';

import { Check, ChevronDown, Loader2, Search, UserPlus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Modal } from '@/components/modal/modal';
import { useInviteMemberMutation } from '@/hooks/graphql/intent-members';
import { useUsersQuery } from '@/hooks/graphql/users';
import { IntentMemberCoreFragment_IntentMember_user_User as GqlUser } from '@/lib/graphql/__generated__/react-query-update';

/* ---------------------------------- API ---------------------------------- */

export type InviteUsersModalProps = {
  open: boolean;
  onClose: () => void;

  /** ID wydarzenia do którego zapraszamy */
  intentId: string;

  /** Opcjonalne podpowiedzi do „Suggested attendees” (np. znajomi / ostatnio zapraszani) */
  suggestions?: Array<Pick<GqlUser, 'id' | 'name' | 'imageUrl' | 'email'>>;

  /** Callback po skutecznym zaproszeniu (zwraca listę userId z sukcesem) */
  onInvited?: (invitedUserIds: string[]) => void;
};

/* ------------------------------ Pomocnicze UI ----------------------------- */

const cx = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(' ');

function Avatar({
  user,
  size = 32,
  rounded = 'rounded-full',
}: {
  user: Pick<GqlUser, 'name' | 'imageUrl'>;
  size?: number;
  rounded?: string;
}) {
  const initials = (user.name ?? '')
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return user.imageUrl ? (
    <img
      src={user.imageUrl}
      alt=""
      className={`${rounded} object-cover ring-1 ring-zinc-200 dark:ring-zinc-700`}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={cx(
        'grid place-items-center bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ring-1 ring-zinc-300 dark:ring-zinc-700',
        rounded
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="text-xs">{initials || 'U'}</span>
    </div>
  );
}

function Chip({
  user,
  onRemove,
}: {
  user: Pick<GqlUser, 'id' | 'name' | 'imageUrl'>;
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

/* --------------------------------- Modal --------------------------------- */

export function InviteUsersModal({
  open,
  onClose,
  intentId,
  suggestions = [],
  onInvited,
}: InviteUsersModalProps) {
  /* ------------------------------ Query state ----------------------------- */

  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  // debounce input (300ms)
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
      role: null,
      verifiedOnly: null,
      sortBy: undefined,
      sortDir: undefined,
    },
    { enabled: open }
  );

  const users = data?.users.items ?? [];
  const total = data?.users.pageInfo.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  /* --------------------------- Selection (multi) -------------------------- */

  const [selected, setSelected] = useState<Record<string, GqlUser>>({});
  const selectedList = useMemo(() => Object.values(selected), [selected]);

  const togglePick = (u: GqlUser) =>
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

  // Clear selection when modal closes
  useEffect(() => {
    if (!open) {
      setSelected({});
      setQ('');
      setOffset(0);
    }
  }, [open]);

  /* ---------------------------- Invite (batch) ---------------------------- */

  const inviteOne = useInviteMemberMutation(); // expects { intentId, userId }

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
          input: {
            intentId,
            userId,
          },
        });
        setProgress(Math.round(((idx + 1) / ids.length) * 100));
        return res;
      })
    );

    const okIds: string[] = [];
    const failed: Array<{ id: string; reason?: any }> = [];

    results.forEach((r, i) => {
      const id = ids[i];
      if (r.status === 'fulfilled') okIds.push(id);
      else failed.push({ id, reason: r.reason });
    });

    // TODO: podmień na system toastów
    console.log(
      `Invited OK: ${okIds.length}, failed: ${failed.length}`,
      failed.map((f) => f.id)
    );

    onInvited?.(okIds);
    setInviting(false);

    if (failed.length === 0) onClose();
  }

  /* ------------------------------ Modal parts ----------------------------- */

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

  const Content = (
    <div className="min-h-0">
      {/* Selected chips */}
      {selectedList.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {selectedList.map((u) => (
            <Chip key={u.id} user={u} onRemove={removePick} />
          ))}
        </div>
      )}

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

      {/* Results list */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {users.length === 0 ? (
          <div className="grid place-items-center p-10 text-sm text-zinc-500">
            {debounced.trim().length < 2
              ? 'Type at least 2 characters to search'
              : 'No users found'}
          </div>
        ) : (
          <ul className="max-h-[46vh] overflow-auto [scrollbar-gutter:stable] divide-y divide-zinc-100 dark:divide-zinc-900">
            {users.map((u) => {
              const picked = !!selected[u.id];
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => togglePick(u as GqlUser)}
                    className={cx(
                      'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors',
                      'hover:bg-zinc-50 dark:hover:bg-zinc-900/50',
                      picked && 'bg-indigo-50/60 dark:bg-indigo-900/20'
                    )}
                  >
                    <Avatar user={u} size={36} rounded="rounded-full" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {u.name || '—'}
                      </div>
                      <div className="truncate text-xs text-zinc-500">
                        {u.email ?? '—'}
                      </div>
                    </div>
                    <span
                      className={cx(
                        'grid h-7 w-7 place-items-center rounded-full border',
                        picked
                          ? 'border-indigo-300 bg-indigo-600 text-white'
                          : 'border-zinc-300 text-transparent'
                      )}
                      aria-hidden
                    >
                      <Check className="h-4 w-4" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between gap-2 border-t border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
          <div className="text-xs text-zinc-500">
            Total {total} · Offset {offset} · Limit {limit}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => canPrev && setOffset(Math.max(0, offset - limit))}
              disabled={!canPrev || isLoading || isFetching}
              className={cx(
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
              className={cx(
                'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5',
                'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900',
                (!canNext || isLoading || isFetching) && 'opacity-50'
              )}
            >
              Next ›
            </button>

            {/* Page size (placeholder) */}
            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Page: {limit} <ChevronDown className="h-4 w-4 opacity-70" />
              </button>
            </div>
          </div>
        </div>
      </div>

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
                  onClick={() => togglePick(u as GqlUser)}
                  className={cx(
                    'relative grid place-items-center rounded-full p-0.5',
                    'ring-1 ring-zinc-200 hover:ring-indigo-400 dark:ring-zinc-700'
                  )}
                  title={u.name || u.email || ''}
                >
                  <Avatar user={u} size={44} />
                  <span
                    className={cx(
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

  const Footer = (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs text-zinc-500">
        Selected: {selectedList.length}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          disabled={isFetching}
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
          className={cx(
            'inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500',
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
      content={Content}
      header={Header}
      footer={Footer}
    />
  );
}
