'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  Instagram,
  Facebook,
  Twitter,
  Globe,
  MessageCircle,
} from 'lucide-react';
import {
  useAddUserSocialLink,
  useRemoveUserSocialLink,
} from '@/lib/api/user-profile';
import type { GetMyFullProfileQuery } from '@/lib/api/__generated__/react-query-update';
import { NoticeModal } from '@/components/feedback/notice-modal';

type SocialLinksTabProps = {
  user: GetMyFullProfileQuery['user'] | null | undefined;
  userId: string;
};

const PROVIDERS = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    placeholder: 'instagram.com/username',
    color: 'text-pink-600 dark:text-pink-400',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    placeholder: 'facebook.com/username',
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    icon: Twitter,
    placeholder: 'x.com/username',
    color: 'text-zinc-900 dark:text-zinc-100',
  },
  {
    id: 'strava',
    label: 'Strava',
    icon: Globe,
    placeholder: 'strava.com/athletes/...',
    color: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'discord',
    label: 'Discord',
    icon: MessageCircle,
    placeholder: 'discord.gg/...',
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'website',
    label: 'Website',
    icon: Globe,
    placeholder: 'yourwebsite.com',
    color: 'text-zinc-600 dark:text-zinc-400',
  },
];

export function SocialLinksTab({ user }: SocialLinksTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [url, setUrl] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<{
    id: string;
    provider: string;
  } | null>(null);

  const addMutation = useAddUserSocialLink();
  const removeMutation = useRemoveUserSocialLink();

  const socialLinks = user?.socialLinks ?? [];

  const resetForm = () => {
    setSelectedProvider('');
    setUrl('');
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!selectedProvider || !url.trim()) return;

    await addMutation.mutateAsync({
      input: {
        provider: selectedProvider,
        url: url.trim(),
      },
    });

    resetForm();
  };

  const handleDeleteClick = (link: any) => {
    setLinkToDelete({
      id: link.id,
      provider: link.provider,
    });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!linkToDelete) return;

    await removeMutation.mutateAsync({ id: linkToDelete.id });
    setDeleteModalOpen(false);
    setLinkToDelete(null);
  };

  const getProviderConfig = (provider: string): (typeof PROVIDERS)[number] => {
    const found = PROVIDERS.find((p) => p.id === provider);
    // @ts-expect-error - TypeScript doesn't infer that PROVIDERS is non-empty
    return found || PROVIDERS[PROVIDERS.length - 1];
  };

  const availableProviders = PROVIDERS.filter(
    (p) => !socialLinks.some((link) => link.provider === p.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Social Links
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Connect your social media accounts (max 10 links)
          </p>
        </div>
        {!isAdding && socialLinks.length < 10 && (
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <h4 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Add Social Link
          </h4>
          <div className="space-y-4">
            {/* Provider Select */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Platform
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="block w-full px-3 py-2 mt-2 text-sm bg-white border rounded-lg border-zinc-300 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Select a platform...</option>
                {availableProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  selectedProvider
                    ? getProviderConfig(selectedProvider)?.placeholder ||
                      'https://...'
                    : 'https://...'
                }
                className="block w-full px-3 py-2 mt-2 text-sm bg-white border rounded-lg border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                You can paste the full URL or just the username/path
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                disabled={addMutation.isPending}
                className="px-4 py-2 text-sm font-medium border rounded-lg border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  !selectedProvider || !url.trim() || addMutation.isPending
                }
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {addMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Links List */}
      {socialLinks.length === 0 ? (
        <div className="p-12 text-center border rounded-lg border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No social links added yet. Click "Add Link" to connect your
            accounts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {socialLinks.map((link) => {
            const providerConfig = getProviderConfig(link.provider);
            const Icon = providerConfig.icon;

            return (
              <div
                key={link.id}
                className="flex items-center justify-between p-4 bg-white border rounded-lg border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 ${providerConfig.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {providerConfig.label}
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {link.url}
                    </a>
                  </div>
                  {link.verified && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Verified
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteClick(link)}
                  disabled={isAdding}
                  className="p-2 text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Max Links Warning */}
      {socialLinks.length >= 10 && (
        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            You've reached the maximum of 10 social links. Remove a link to add
            a new one.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <NoticeModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        variant="error"
        size="sm"
        title="Delete Social Link"
        subtitle={`Are you sure you want to remove your ${linkToDelete ? getProviderConfig(linkToDelete.provider)?.label || 'social' : ''} link? This action cannot be undone.`}
        primaryLabel={removeMutation.isPending ? 'Deleting...' : 'Delete'}
        secondaryLabel="Cancel"
        onPrimary={handleDeleteConfirm}
        onSecondary={() => setDeleteModalOpen(false)}
      >
        <></>
      </NoticeModal>
    </div>
  );
}

export default SocialLinksTab;
