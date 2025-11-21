'use client';

import * as React from 'react';
import {
  useIntentInviteLinksQuery,
  useCreateIntentInviteLinkMutation,
  useRevokeIntentInviteLinkMutation,
  useDeleteIntentInviteLinkMutation,
} from '@/lib/api/invite-links';
import {
  Copy,
  Plus,
  Trash2,
  Ban,
  ExternalLink,
  Calendar,
  Users,
  Check,
  Edit,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { EditLinkModal } from './edit-link-modal';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';

interface InviteLinksPanelProps {
  intentId: string;
}

export function InviteLinksPanel({ intentId }: InviteLinksPanelProps) {
  const [showRevoked, setShowRevoked] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [expandedLinkId, setExpandedLinkId] = React.useState<string | null>(
    null
  );
  const [editingLink, setEditingLink] = React.useState<{
    id: string;
    label: string | null;
    maxUses: number | null;
    code: string;
  } | null>(null);

  const { data, isLoading, refetch } = useIntentInviteLinksQuery({
    intentId,
    includeRevoked: showRevoked,
  });

  const createLink = useCreateIntentInviteLinkMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const revokeLink = useRevokeIntentInviteLinkMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteLink = useDeleteIntentInviteLinkMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const links = data?.intentInviteLinks ?? [];

  const handleCreateLink = async () => {
    await createLink.mutateAsync({
      input: {
        intentId,
        label: `Link ${links.length + 1}`,
        maxUses: null,
        expiresAt: null,
      },
    });
  };

  const handleCopyLink = async (code: string, id: string) => {
    const url = `${window.location.origin}/i/${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevokeLink = async (id: string) => {
    if (confirm('Czy na pewno chcesz odwołać ten link?')) {
      await revokeLink.mutateAsync({ id });
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (
      confirm(
        'Czy na pewno chcesz usunąć ten link? Ta operacja jest nieodwracalna.'
      )
    ) {
      await deleteLink.mutateAsync({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Linki zaproszeniowe
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Twórz i zarządzaj linkami do dołączania do wydarzenia
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateLink}
          disabled={createLink.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Utwórz link
        </button>
      </div>

      {/* Show revoked toggle */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showRevoked}
          onChange={(e) => setShowRevoked(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-zinc-700 dark:text-zinc-300">
          Pokaż odwołane linki
        </span>
      </label>

      {/* Links list */}
      {links.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Brak linków zaproszeniowych. Utwórz pierwszy link!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
              className={clsx(
                'rounded-2xl border p-4 transition-colors',
                link.isRevoked
                  ? 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20'
                  : link.isValid
                    ? 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                    : 'border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Label */}
                  {link.label && (
                    <div className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {link.label}
                    </div>
                  )}

                  {/* Code */}
                  <div className="mb-2 flex items-center gap-2">
                    <code className="rounded bg-zinc-100 px-2 py-1 text-xs font-mono text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {window.location.origin}/i/{link.code}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(link.code, link.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      {copiedId === link.id ? (
                        <>
                          <Check className="h-3 w-3" />
                          Skopiowano
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Kopiuj
                        </>
                      )}
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>
                        {link.usedCount}
                        {link.maxUses ? ` / ${link.maxUses}` : ''} użyć
                      </span>
                    </div>
                    {link.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Wygasa:{' '}
                          {format(
                            new Date(link.expiresAt),
                            'dd MMM yyyy, HH:mm',
                            { locale: pl }
                          )}
                        </span>
                      </div>
                    )}
                    {link.createdBy && (
                      <div className="text-xs">
                        Utworzył: {link.createdBy.name}
                      </div>
                    )}
                  </div>

                  {/* Status badges */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {link.isRevoked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <Ban className="h-3 w-3" />
                        Odwołany
                      </span>
                    )}
                    {link.isExpired && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Calendar className="h-3 w-3" />
                        Wygasły
                      </span>
                    )}
                    {link.isMaxedOut && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Users className="h-3 w-3" />
                        Limit osiągnięty
                      </span>
                    )}
                    {link.isValid && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Check className="h-3 w-3" />
                        Aktywny
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2">
                  <a
                    href={`/i/${link.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-zinc-100 p-2 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    title="Otwórz link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {!link.isRevoked && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingLink({
                            id: link.id,
                            label: link.label ?? null,
                            maxUses: link.maxUses ?? null,
                            code: link.code,
                          })
                        }
                        className="inline-flex items-center justify-center rounded-lg bg-indigo-100 p-2 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                        title="Edytuj link"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevokeLink(link.id)}
                        disabled={revokeLink.isPending}
                        className="inline-flex items-center justify-center rounded-lg bg-amber-100 p-2 text-amber-700 hover:bg-amber-200 disabled:opacity-50 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                        title="Odwołaj link"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteLink(link.id)}
                    disabled={deleteLink.isPending}
                    className="inline-flex items-center justify-center rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                    title="Usuń link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expandable section for users who used this link */}
              {link.usedCount > 0 && (
                <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedLinkId(
                        expandedLinkId === link.id ? null : link.id
                      )
                    }
                    className="flex w-full items-center justify-between text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                  >
                    <span>Użytkownicy ({link.uses?.length || 0})</span>
                    {expandedLinkId === link.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {expandedLinkId === link.id && link.uses && (
                    <div className="mt-3 space-y-2">
                      {link.uses.map((usage) => (
                        <div
                          key={usage.id}
                          className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/50"
                        >
                          <Avatar
                            url={buildAvatarUrl(usage.user.avatarKey, 'xs')}
                            blurhash={usage.user.avatarBlurhash}
                            alt={usage.user.name}
                            size={32}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {usage.user.name}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-500">
                              Dołączył:{' '}
                              {format(
                                new Date(usage.usedAt),
                                'dd MMM yyyy, HH:mm',
                                { locale: pl }
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Link Modal */}
      <EditLinkModal
        open={!!editingLink}
        onClose={() => setEditingLink(null)}
        link={editingLink}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
