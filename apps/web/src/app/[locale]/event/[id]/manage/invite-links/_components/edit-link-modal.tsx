'use client';

import * as React from 'react';
import { Modal } from '@/components/feedback/modal';
import { useUpdateEventInviteLinkMutation } from '@/features/events/api/invite-links';
import { Loader2, Save } from 'lucide-react';
import clsx from 'clsx';

interface EditLinkModalProps {
  open: boolean;
  onClose: () => void;
  link: {
    id: string;
    label: string | null;
    maxUses: number | null;
    code: string;
  } | null;
  onSuccess?: () => void;
}

export function EditLinkModal({
  open,
  onClose,
  link,
  onSuccess,
}: EditLinkModalProps) {
  const [label, setLabel] = React.useState('');
  const [maxUses, setMaxUses] = React.useState<string>('');
  const [unlimitedUses, setUnlimitedUses] = React.useState(true);

  const updateMutation = useUpdateEventInviteLinkMutation();

  // Reset form when link changes
  React.useEffect(() => {
    if (link) {
      setLabel(link.label || '');
      setMaxUses(link.maxUses?.toString() || '');
      setUnlimitedUses(!link.maxUses);
    }
  }, [link]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;

    try {
      await updateMutation.mutateAsync({
        id: link.id,
        input: {
          label: label.trim() || null,
          maxUses: unlimitedUses ? null : parseInt(maxUses) || null,
        },
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update link:', error);
    }
  };

  if (!link) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="default"
      density="compact"
      size="sm"
      ariaLabel="Edytuj link zaproszeniowy"
      header={
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Edytuj link zaproszeniowy
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Zmień etykietę lub limit użyć dla tego linku
          </p>
        </div>
      }
      content={
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code (read-only) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Kod linku
            </label>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              {link.code}
            </div>
          </div>

          {/* Label */}
          <div>
            <label
              htmlFor="label"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Etykieta (opcjonalna)
            </label>
            <input
              type="text"
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="np. Link dla przyjaciół"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500"
              maxLength={100}
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              Pomaga zidentyfikować link w liście
            </p>
          </div>

          {/* Max Uses */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Limit użyć
            </label>

            <div className="space-y-3">
              {/* Unlimited checkbox */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={unlimitedUses}
                  onChange={(e) => setUnlimitedUses(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Nieograniczona liczba użyć
                </span>
              </label>

              {/* Max uses input */}
              {!unlimitedUses && (
                <div>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Wpisz liczbę"
                    min="1"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    Maksymalna liczba osób, które mogą użyć tego linku
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {updateMutation.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
              <p className="text-sm text-red-700 dark:text-red-400">
                Wystąpił błąd podczas aktualizacji linku. Spróbuj ponownie.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className={clsx(
                'flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white',
                'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50'
              )}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Zapisz zmiany
                </>
              )}
            </button>
          </div>
        </form>
      }
    />
  );
}
