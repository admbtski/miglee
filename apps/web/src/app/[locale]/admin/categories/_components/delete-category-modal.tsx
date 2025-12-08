'use client';

import { useState } from 'react';
import { Modal } from '@/components/feedback/modal';
import { Trash2, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import {
  useDeleteCategoryMutation,
  useGetCategoryUsageCountQuery,
} from '@/features/categories/api/categories';
import Link from 'next/link';

type DeleteCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  category: {
    id: string;
    slug: string;
    names: Record<string, string>;
  };
};

export function DeleteCategoryModal({
  open,
  onClose,
  category,
}: DeleteCategoryModalProps) {
  const [error, setError] = useState('');

  const deleteMutation = useDeleteCategoryMutation();

  // Check usage count
  const { data: usageData, isLoading: loadingUsage } =
    useGetCategoryUsageCountQuery(
      {
        slug: category.slug,
      },
      {
        enabled: open,
      }
    );

  const usageCount = usageData?.getCategoryUsageCount ?? 0;
  const isUsed = usageCount > 0;

  const handleDelete = async () => {
    if (isUsed) {
      setError('Nie można usunąć kategorii, która jest używana');
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        id: category.id,
      });
      onClose();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      setError(error.message || 'Nie udało się usunąć kategorii');
    }
  };

  const handleClose = () => {
    if (!deleteMutation.isPending) {
      setError('');
      onClose();
    }
  };

  const categoryName = (category.names as any)?.pl || category.slug;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      variant="centered"
      size="md"
      header={
        <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span>Usuń kategorię</span>
        </h3>
      }
      content={
        <div className="space-y-4">
          {loadingUsage && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          )}

          {!loadingUsage && isUsed && (
            <div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 dark:text-red-200">
                      Nie można usunąć kategorii
                    </h4>
                    <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                      Kategoria <strong>{categoryName}</strong> jest używana
                      przez <strong>{usageCount}</strong>{' '}
                      {usageCount === 1
                        ? 'wydarzenie'
                        : usageCount < 5
                          ? 'wydarzenia'
                          : 'wydarzeń'}
                      .
                    </p>
                    <p className="mt-2 text-sm text-red-800 dark:text-red-300">
                      Usuń lub zmień kategorie w tych wydarzeniach, a potem
                      spróbuj ponownie.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  href={`/admin/events?categorySlugs=${category.slug}`}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                  onClick={handleClose}
                >
                  <ExternalLink className="h-4 w-4" />
                  Pokaż wydarzenia z tą kategorią
                </Link>
              </div>
            </div>
          )}

          {!loadingUsage && !isUsed && (
            <div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-900 dark:text-amber-200">
                      Potwierdź usunięcie
                    </h4>
                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                      Czy na pewno chcesz usunąć kategorię{' '}
                      <strong>{categoryName}</strong>?
                    </p>
                    <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
                      <strong>Operacja jest nieodwracalna.</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  <strong>Slug:</strong> {category.slug}
                </p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  <strong>Nazwa (PL):</strong> {categoryName}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
              <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={deleteMutation.isPending}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {isUsed ? 'Zamknij' : 'Anuluj'}
          </button>
          {!isUsed && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending || loadingUsage}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {deleteMutation.isPending ? 'Usuwanie...' : 'Usuń kategorię'}
            </button>
          )}
        </div>
      }
    />
  );
}
