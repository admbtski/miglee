/**
 * Sports Tab Component
 * Allows users to manage their sports and skill levels
 */

'use client';

import { useState } from 'react';

// Icons
import { Edit2, Loader2, Plus, Save, Trash2 } from 'lucide-react';

// Components
import { NoticeModal } from '@/components/feedback/notice-modal';
import { CategoryMultiCombo } from '@/components/forms/category-combobox';

// Features
import { CategoryOption } from '@/features/categories';
import {
  useRemoveUserCategoryLevel,
  useUpsertUserCategoryLevel,
} from '@/features/users/api/user-profile';

// Types
import type {
  GetMyFullProfileQuery,
  Level as GQLLevel,
} from '@/lib/api/__generated__/react-query-update';

type SportsTabProps = {
  user: GetMyFullProfileQuery['user'] | null | undefined;
  userId: string;
};

type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// TODO: Add i18n for level labels: "Beginner", "Intermediate", "Advanced"
const LEVELS: { value: Level; label: string; color: string }[] = [
  {
    value: 'BEGINNER',
    label: 'Beginner',
    color:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  {
    value: 'INTERMEDIATE',
    label: 'Intermediate',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  {
    value: 'ADVANCED',
    label: 'Advanced',
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
];

export function SportsTab({ user }: SportsTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryLevelToDelete, setCategoryLevelToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Form state
  const [selectedCategories, setSelectedCategories] = useState<
    CategoryOption[]
  >([]);
  const [selectedLevel, setSelectedLevel] = useState<Level>('BEGINNER');
  const [notes, setNotes] = useState('');

  const upsertMutation = useUpsertUserCategoryLevel();
  const removeMutation = useRemoveUserCategoryLevel();

  const categoryLevels = user?.categoryLevels ?? [];

  const resetForm = () => {
    setSelectedCategories([]);
    setSelectedLevel('BEGINNER');
    setNotes('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    setIsAdding(true);
    resetForm();
    setIsAdding(true);
  };

  const handleEdit = (categoryLevel: any) => {
    setEditingId(categoryLevel.id);

    // Set selected category for editing
    const categoryOption: CategoryOption = {
      id: categoryLevel.category.id,
      label: getCategoryName(categoryLevel.category),
      slug: categoryLevel.category.slug,
    };
    setSelectedCategories([categoryOption]);

    setSelectedLevel(categoryLevel.level as Level);
    setNotes(categoryLevel.notes || '');
    setIsAdding(false);
  };

  const handleSave = async () => {
    const selectedCategory = selectedCategories[0];
    if (!selectedCategory) return;

    await upsertMutation.mutateAsync({
      input: {
        id: editingId || undefined,
        categoryId: selectedCategory.id,
        level: selectedLevel as GQLLevel,
        notes: notes.trim() || undefined,
      },
    });

    resetForm();
  };

  const handleDeleteClick = (categoryLevel: any) => {
    const categoryName =
      typeof categoryLevel.category.names === 'object'
        ? categoryLevel.category.names.en || categoryLevel.category.slug
        : categoryLevel.category.slug;

    setCategoryLevelToDelete({
      id: categoryLevel.id,
      name: categoryName,
    });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryLevelToDelete) return;

    await removeMutation.mutateAsync({ id: categoryLevelToDelete.id });
    setDeleteModalOpen(false);
    setCategoryLevelToDelete(null);
  };

  const getCategoryName = (category: any) => {
    if (typeof category.names === 'object') {
      return category.names.en || category.names.pl || category.slug;
    }
    return category.slug;
  };

  const getLevelConfig = (level: string) =>
    LEVELS.find((l) => l.value === level) || LEVELS[0];

  // TODO: Add i18n for all hardcoded strings in this component:
  // - "Sports & Category Levels", "Add the sports you practice and your skill level"
  // - "Add Category Level", "Edit Category Level", "Add New Category Level"
  // - "Sport / Discipline", "Search and select a sport or discipline", "Search sport..."
  // - "Skill Level", "Notes (optional)", "Any additional information..."
  // - "Cancel", "Saving...", "Save", "No category levels added yet. Click 'Add Category Level' to get started."
  // - "Edit", "Delete", "Delete Category Level", "Are you sure you want to remove ... ? This action cannot be undone."
  // - "Deleting...", "Delete", "Cancel"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Sports & Category Levels
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Add the sports you practice and your skill level
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Category Level
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <h4 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {editingId ? 'Edit Category Level' : 'Add New Category Level'}
          </h4>
          <div className="space-y-4">
            {/* Category Select */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Sport / Discipline
              </label>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Search and select a sport or discipline
              </p>
              <div className="mt-2">
                <CategoryMultiCombo
                  values={selectedCategories}
                  onChange={setSelectedCategories}
                  placeholder="Search sport..."
                  maxCount={1}
                  size="md"
                />
              </div>
            </div>

            {/* Level Select */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Skill Level
              </label>
              <div className="flex gap-2 mt-2">
                {LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setSelectedLevel(level.value)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      selectedLevel === level.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any additional information..."
                className="block w-full px-3 py-2 mt-2 text-sm bg-white border rounded-lg border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                disabled={upsertMutation.isPending}
                className="px-4 py-2 text-sm font-medium border rounded-lg border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  selectedCategories.length === 0 || upsertMutation.isPending
                }
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {upsertMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Levels List */}
      {categoryLevels.length === 0 ? (
        <div className="p-12 text-center border rounded-lg border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No category levels added yet. Click "Add Category Level" to get
            started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {categoryLevels.map((categoryLevel) => {
            const levelConfig = getLevelConfig(categoryLevel.level);
            const categoryName = getCategoryName(categoryLevel.category);

            return (
              <div
                key={categoryLevel.id}
                className="flex items-center justify-between p-4 bg-white border rounded-lg border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {categoryName}
                    </h4>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${levelConfig?.color || ''}`}
                    >
                      {levelConfig?.label || categoryLevel.level}
                    </span>
                  </div>
                  {categoryLevel.notes && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {categoryLevel.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(categoryLevel)}
                    disabled={isAdding || editingId !== null}
                    className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(categoryLevel)}
                    disabled={isAdding || editingId !== null}
                    className="p-2 text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <NoticeModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        variant="error"
        size="sm"
        title="Delete Category Level"
        subtitle={`Are you sure you want to remove ${categoryLevelToDelete?.name || 'this category level'}? This action cannot be undone.`}
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

export default SportsTab;
