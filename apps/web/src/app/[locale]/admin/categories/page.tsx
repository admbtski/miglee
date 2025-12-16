'use client';

import { useState } from 'react';
import { useGetCategoriesQuery } from '@/features/categories';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { AddCategoryModal } from './_components/add-category-modal';
import { EditCategoryModal } from './_components/edit-category-modal';
import { DeleteCategoryModal } from './_components/delete-category-modal';

type Category = {
  id: string;
  slug: string;
  names: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const { data, isLoading } = useGetCategoriesQuery({
    query: search || undefined,
    limit: 100,
  });

  const categories = (data?.categories ?? []) as Category[];

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setEditModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  const getTranslationCount = (names: Record<string, string>) => {
    return ['pl', 'en', 'de'].filter(
      (lang) => names[lang] && names[lang].trim().length > 0
    ).length;
  };

  const getMissingTranslations = (names: Record<string, string>) => {
    return ['pl', 'en', 'de']
      .filter((lang) => !names[lang] || names[lang].trim().length === 0)
      .map((lang) => lang.toUpperCase())
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Kategorie
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Zarządzanie kategoriami wydarzeń
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Dodaj kategorię
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

        {!isLoading && categories.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {search
                ? 'Nie znaleziono kategorii pasujących do wyszukiwania'
                : 'Brak kategorii'}
            </p>
          </div>
        )}

        {!isLoading && categories.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Nazwa (PL)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Tłumaczenia
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
                {categories.map((category) => {
                  const translationCount = getTranslationCount(category.names);
                  const missingTranslations = getMissingTranslations(
                    category.names
                  );

                  return (
                    <tr
                      key={category.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {(category.names as any)?.pl || category.slug}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                        <div className="inline-flex items-center gap-1">
                          <span
                            className={`font-medium ${
                              translationCount === 3
                                ? 'text-green-600 dark:text-green-400'
                                : translationCount === 2
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {translationCount}/3
                          </span>
                          {translationCount < 3 && (
                            <span
                              className="cursor-help text-xs text-zinc-500 dark:text-zinc-400"
                              title={`Brakuje: ${missingTranslations}`}
                            >
                              ⓘ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {format(new Date(category.createdAt), 'dd MMM yyyy', {
                          locale: pl,
                        })}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(category)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                            Edytuj
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                            Usuń
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCategoryModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />

      {selectedCategory && (
        <>
          <EditCategoryModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedCategory(null);
            }}
            category={selectedCategory}
          />
          <DeleteCategoryModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedCategory(null);
            }}
            category={selectedCategory}
          />
        </>
      )}
    </div>
  );
}
