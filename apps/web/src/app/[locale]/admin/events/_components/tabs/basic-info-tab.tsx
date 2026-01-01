'use client';

import { format, pl } from '@/lib/date';
import { useState } from 'react';
import { useAdminUpdateEventMutation } from '@/features/admin';
import { Edit2, Save, X, User } from 'lucide-react';

type BasicInfoTabProps = {
  event: any;
  onRefresh?: () => void;
};

export function BasicInfoTab({ event, onRefresh }: BasicInfoTabProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title || '');
  const [description, setDescription] = useState(event.description || '');

  const updateMutation = useAdminUpdateEventMutation();

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: event.id,
        input: {
          title,
          description,
        },
      });
      setEditing(false);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleCancel = () => {
    setTitle(event.title || '');
    setDescription(event.description || '');
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Edit Controls */}
      <div className="flex justify-end gap-2">
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Edit2 className="h-4 w-4" />
            Edytuj
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Podstawowe informacje
        </h3>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tytuł
            </label>
            {editing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            ) : (
              <p className="text-sm text-zinc-900 dark:text-zinc-100">
                {event.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Opis
            </label>
            {editing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            ) : (
              <p className="text-sm text-zinc-900 dark:text-zinc-100">
                {event.description || 'Brak opisu'}
              </p>
            )}
          </div>

          {/* Owner */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Organizator
            </label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-400" />
              <span className="text-sm text-zinc-900 dark:text-zinc-100">
                {event.owner?.name || 'N/A'}
              </span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                ({event.owner?.email})
              </span>
            </div>
          </div>

          {/* Categories */}
          {event.categorySlugs && event.categorySlugs.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Kategorie
              </label>
              <div className="flex flex-wrap gap-2">
                {event.categorySlugs.map((slug: string) => (
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
          {event.levels && event.levels.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Poziomy
              </label>
              <div className="flex flex-wrap gap-2">
                {event.levels.map((level: string) => (
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
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Statystyki
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Członkowie
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {event.joinedCount || 0}
              {event.min && event.max && ` / ${event.min}-${event.max}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Komentarze
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {event.commentsCount || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Wiadomości
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {event.messagesCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Metadata
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">
              Data utworzenia:
            </span>
            <span className="text-zinc-900 dark:text-zinc-100">
              {format(new Date(event.createdAt), 'dd MMM yyyy, HH:mm', {
                locale: pl,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">
              Ostatnia aktualizacja:
            </span>
            <span className="text-zinc-900 dark:text-zinc-100">
              {format(new Date(event.updatedAt), 'dd MMM yyyy, HH:mm', {
                locale: pl,
              })}
            </span>
          </div>
          {event.canceledAt && (
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">
                Anulowano:
              </span>
              <span className="text-red-600 dark:text-red-400">
                {format(new Date(event.canceledAt), 'dd MMM yyyy, HH:mm', {
                  locale: pl,
                })}
              </span>
            </div>
          )}
          {event.deletedAt && (
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">
                Usunięto:
              </span>
              <span className="text-red-600 dark:text-red-400">
                {format(new Date(event.deletedAt), 'dd MMM yyyy, HH:mm', {
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
