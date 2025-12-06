'use client';

import * as React from 'react';
import {
  useIntentInviteLinksQuery,
  useCreateIntentInviteLinkMutation,
  useRevokeIntentInviteLinkMutation,
  useDeleteIntentInviteLinkMutation,
} from '@/lib/api/invite-links';
import { useIntentQuery } from '@/lib/api/intents';
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
  Link as LinkIcon,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { EditLinkModal } from './edit-link-modal';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';
import {
  PlanUpgradeBanner,
  type SponsorshipPlan,
} from '../../_components/plan-upgrade-banner';

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

  // Fetch intent to check plan
  const { data: intentData, isLoading: intentLoading } = useIntentQuery({
    id: intentId,
  });

  const { data, isLoading, refetch } = useIntentInviteLinksQuery({
    intentId,
    includeRevoked: showRevoked,
  });

  const sponsorshipPlan = intentData?.intent
    ?.sponsorshipPlan as SponsorshipPlan;

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
    if (confirm('Are you sure you want to revoke this link?')) {
      await revokeLink.mutateAsync({ id });
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (
      confirm(
        'Are you sure you want to delete this link? This action cannot be undone.'
      )
    ) {
      await deleteLink.mutateAsync({ id });
    }
  };

  if (isLoading || intentLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Loading invite links...
          </p>
        </div>
      </div>
    );
  }

  return (
    <PlanUpgradeBanner
      currentPlan={sponsorshipPlan}
      requiredPlan="PLUS"
      featureName="Linki zaproszeniowe dostępne w planach Plus i Pro"
      featureDescription="Twórz unikalne linki zaproszeniowe z limitami użyć i datami wygaśnięcia. Śledź kto dołączył przez który link i zarządzaj dostępem do wydarzenia."
      intentId={intentId}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
              <LinkIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Invite Links
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Create and manage invite links for your event
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreateLink}
            disabled={createLink.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-md disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Create Link
          </button>
        </div>

        {/* Show revoked toggle */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showRevoked}
            onChange={(e) => setShowRevoked(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Show revoked links
          </span>
        </label>

        {/* Links list */}
        {links.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
            <LinkIcon className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              No invite links yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Create your first invite link to share with potential participants
            </p>
            <button
              type="button"
              onClick={handleCreateLink}
              disabled={createLink.isPending}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-md disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Create First Link
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <div
                key={link.id}
                className={cn(
                  'rounded-2xl border p-5 transition-all',
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
                      <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {link.label}
                      </div>
                    )}

                    {/* Code */}
                    <div className="mb-3 flex items-center gap-2">
                      <code className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {window.location.origin}/i/{link.code}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(link.code, link.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        {copiedId === link.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {link.usedCount}
                          {link.maxUses ? ` / ${link.maxUses}` : ''} uses
                        </span>
                      </div>
                      {link.expiresAt && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Expires:{' '}
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
                          Created by: {link.createdBy.name}
                        </div>
                      )}
                    </div>

                    {/* Status badges */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {link.isRevoked && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <Ban className="h-3 w-3" />
                          Revoked
                        </span>
                      )}
                      {link.isExpired && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Calendar className="h-3 w-3" />
                          Expired
                        </span>
                      )}
                      {link.isMaxedOut && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Users className="h-3 w-3" />
                          Limit Reached
                        </span>
                      )}
                      {link.isValid && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <Check className="h-3 w-3" />
                          Active
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      title="Open link"
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
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 transition-colors hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                          title="Edit link"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevokeLink(link.id)}
                          disabled={revokeLink.isPending}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition-colors hover:bg-amber-200 disabled:opacity-50 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                          title="Revoke link"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(link.id)}
                      disabled={deleteLink.isPending}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                      title="Delete link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expandable section for users who used this link */}
                {link.usedCount > 0 && (
                  <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLinkId(
                          expandedLinkId === link.id ? null : link.id
                        )
                      }
                      className="flex w-full items-center justify-between text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                    >
                      <span>Users ({link.uses?.length || 0})</span>
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
                            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/50"
                          >
                            <Avatar
                              url={buildAvatarUrl(usage.user.avatarKey, 'xs')}
                              blurhash={usage.user.avatarBlurhash}
                              alt={usage.user.name}
                              size={32}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {usage.user.name}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-500">
                                Joined:{' '}
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

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/30">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium">About Invite Links</p>
            <p className="mt-1 text-blue-700 dark:text-blue-300">
              Invite links allow you to share your event with specific people.
              You can set usage limits and expiration dates for each link.
            </p>
          </div>
        </div>

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
    </PlanUpgradeBanner>
  );
}
