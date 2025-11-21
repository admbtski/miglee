'use client';

import { useState } from 'react';
import { useGetTagsQuery } from '@/lib/api/tags';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { AddTagModal } from './_components/add-tag-modal';
import { EditTagModal } from './_components/edit-tag-modal';
import { DeleteTagModal } from './_components/delete-tag-modal';

type Tag = {
  id: string;
  slug: string;
  label: string;
  createdAt: string;
  updatedAt: string;
};

export default function TagsPage() {
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const { data, isLoading } = useGetTagsQuery({
    query: search || undefined,
    limit: 100,
  });

  const tags = (data?.tags ?? []) as Tag[];

  const handleEdit = (tag: Tag) => {
    setSelectedTag(tag);
    setEditModalOpen(true);
  };

  const handleDelete = (tag: Tag) => {
    setSelectedTag(tag);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Tagi
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Zarządzanie tagami wydarzeń
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Dodaj tag
        </button>
      </div>

      {/* Search */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po slug lub nazwie..."
            className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
          </div>
        )}

        {!isLoading && tags.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {search
                ? 'Nie znaleziono tagów pasujących do wyszukiwania'
                : 'Brak tagów'}
            </p>
          </div>
        )}

        {!isLoading && tags.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Nazwa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Utworzono
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                {tags.map((tag) => (
                  <tr
                    key={tag.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {tag.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {tag.label}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {format(new Date(tag.createdAt), 'dd MMM yyyy', {
                        locale: pl,
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(tag)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                          Edytuj
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tag)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                          Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddTagModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />

      {selectedTag && (
        <>
          <EditTagModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedTag(null);
            }}
            tag={selectedTag}
          />
          <DeleteTagModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedTag(null);
            }}
            tag={selectedTag}
          />
        </>
      )}
    </div>
  );
}
