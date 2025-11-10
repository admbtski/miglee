'use client';

import { useState } from 'react';
import { useAdminUpdateIntentMutation } from '@/lib/api/admin-intents';
import { Edit2, Save, X, User } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

type BasicInfoTabProps = {
  intent: any;
  onRefresh?: () => void;
};

export function BasicInfoTab({ intent, onRefresh }: BasicInfoTabProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(intent.title || '');
  const [description, setDescription] = useState(intent.description || '');

  const updateMutation = useAdminUpdateIntentMutation();

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: intent.id,
        input: {
          title,
          description,
        },
      });
      setEditing(false);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update intent:', error);
    }
  };

  const handleCancel = () => {
    setTitle(intent.title || '');
    setDescription(intent.description || '');
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Edit Controls */}
      <div className="flex justify-end gap-2">
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Edit2 className="h-4 w-4" />
            Edytuj
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </>
        )}
      </div>

      {/* Basic Information */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Podstawowe informacje
        </h3>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tytuł
            </label>
            {editing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {intent.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Opis
            </label>
            {editing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {intent.description || 'Brak opisu'}
              </p>
            )}
          </div>

          {/* Owner */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Organizator
            </label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {intent.owner?.name || 'N/A'}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                ({intent.owner?.email})
              </span>
            </div>
          </div>

          {/* Categories */}
          {intent.categorySlugs && intent.categorySlugs.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kategorie
              </label>
              <div className="flex flex-wrap gap-2">
                {intent.categorySlugs.map((slug: string) => (
                  <span
                    key={slug}
                    className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {slug}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Levels */}
          {intent.levels && intent.levels.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Poziomy
              </label>
              <div className="flex flex-wrap gap-2">
                {intent.levels.map((level: string) => (
                  <span
                    key={level}
                    className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  >
                    {level}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Statystyki
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Członkowie
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {intent.joinedCount || 0}
              {intent.min && intent.max && ` / ${intent.min}-${intent.max}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Komentarze
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {intent.commentsCount || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Wiadomości
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {intent.messagesCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Metadata
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Data utworzenia:
            </span>
            <span className="text-gray-900 dark:text-gray-100">
              {format(new Date(intent.createdAt), 'dd MMM yyyy, HH:mm', {
                locale: pl,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Ostatnia aktualizacja:
            </span>
            <span className="text-gray-900 dark:text-gray-100">
              {format(new Date(intent.updatedAt), 'dd MMM yyyy, HH:mm', {
                locale: pl,
              })}
            </span>
          </div>
          {intent.canceledAt && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Anulowano:
              </span>
              <span className="text-red-600 dark:text-red-400">
                {format(new Date(intent.canceledAt), 'dd MMM yyyy, HH:mm', {
                  locale: pl,
                })}
              </span>
            </div>
          )}
          {intent.deletedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Usunięto:
              </span>
              <span className="text-red-600 dark:text-red-400">
                {format(new Date(intent.deletedAt), 'dd MMM yyyy, HH:mm', {
                  locale: pl,
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
