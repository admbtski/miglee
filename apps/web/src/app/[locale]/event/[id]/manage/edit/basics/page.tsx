'use client';

/**
 * Basics Section
 * Fields: Event name, Categories (1-3), Description, Tags (0-3)
 */

// TODO i18n: All hardcoded strings (labels, placeholders, errors, tips)

import { useCallback, useEffect, useState } from 'react';
import { Info } from 'lucide-react';

import { CategoryMultiCombo } from '@/features/categories';
import { TagMultiCombo } from '@/components/forms/tag-multicombo';
import { CategoryOption } from '@/features/categories';
import { TagOption } from '@/features/tags/types';

import { useEdit } from '../_components/edit-provider';
import { EditSection, FormField, InfoBox } from '../_components/edit-section';

const TITLE_MAX = 60;
const DESC_MAX = 500;

export default function BasicsPage() {
  const { event, isLoading, saveSection } = useEdit();

  // Local state for this section
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize from event data
  useEffect(() => {
    if (!event) return;

    setTitle(event.title || '');
    setDescription(event.description || '');
    setCategories(
      event.categories?.map((c) => ({
        id: c.id,
        slug: c.slug,
        label: c.names?.en || c.slug,
        name: c.names?.en || c.slug,
      })) || []
    );
    setTags(
      event.tags?.map((t) => ({
        id: t.id,
        slug: t.slug,
        label: t.label,
        name: t.label,
      })) || []
    );
    setIsDirty(false);
  }, [event]);

  // Validation
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Event name is required';
    } else if (title.length > TITLE_MAX) {
      newErrors.title = `Maximum ${TITLE_MAX} characters`;
    }

    if (categories.length === 0) {
      newErrors.categories = 'Select at least 1 category';
    } else if (categories.length > 3) {
      newErrors.categories = 'Maximum 3 categories';
    }

    if (description && description.length > DESC_MAX) {
      newErrors.description = `Maximum ${DESC_MAX} characters`;
    }

    if (tags.length > 3) {
      newErrors.tags = 'Maximum 3 tags';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, categories, description, tags]);

  // Save handler
  const handleSave = async () => {
    if (!validate()) return false;

    return saveSection('Basics', {
      title: title.trim(),
      description: description.trim() || null,
      categorySlugs: categories.map((c) => c.slug),
      tagSlugs: tags.map((t) => t.slug),
    });
  };

  // Track changes
  const handleTitleChange = (value: string) => {
    setTitle(value);
    setIsDirty(true);
    if (errors.title) setErrors((e) => ({ ...e, title: '' }));
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setIsDirty(true);
    if (errors.description) setErrors((e) => ({ ...e, description: '' }));
  };

  const handleCategoriesChange = (values: CategoryOption[]) => {
    setCategories(values);
    setIsDirty(true);
    if (errors.categories) setErrors((e) => ({ ...e, categories: '' }));
  };

  const handleTagsChange = (values: TagOption[]) => {
    setTags(values);
    setIsDirty(true);
    if (errors.tags) setErrors((e) => ({ ...e, tags: '' }));
  };

  return (
    <EditSection
      title="Basics"
      description="Set up the fundamental details of your event"
      onSave={handleSave}
      isDirty={isDirty}
      isLoading={isLoading}
    >
      {/* Event Name */}
      <FormField
        label="Event name"
        description="Be clear and specific. Max 60 characters."
        required
        error={errors.title}
      >
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="e.g. Morning run in the park"
            className={[
              'w-full rounded-xl border px-4 py-3 pr-14 text-sm transition-all',
              'bg-white dark:bg-zinc-900/60',
              'text-zinc-900 dark:text-zinc-100',
              'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
              errors.title
                ? 'border-red-500 focus:ring-red-500/40'
                : 'border-zinc-300 dark:border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/40',
              'focus:outline-none focus:ring-2',
            ].join(' ')}
          />
          <span
            className={[
              'absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium tabular-nums',
              TITLE_MAX - title.length === 0
                ? 'text-red-500'
                : TITLE_MAX - title.length <= 10
                  ? 'text-amber-500'
                  : 'text-zinc-400',
            ].join(' ')}
          >
            {TITLE_MAX - title.length}
          </span>
        </div>
      </FormField>

      {/* Categories */}
      <FormField
        label="Categories"
        description="Choose 1-3 categories to help others find your event"
        required
        error={errors.categories}
      >
        <CategoryMultiCombo
          placeholder="Search categories..."
          maxCount={3}
          size="md"
          onChange={handleCategoriesChange}
          values={categories}
        />
      </FormField>

      {/* Description */}
      <FormField
        label="Description"
        description="Add details like pace, difficulty, or required equipment"
        error={errors.description}
      >
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            maxLength={DESC_MAX}
            rows={4}
            placeholder="e.g. Easy 5km run around the park. Pace 6:00/km."
            className={[
              'w-full rounded-xl border px-4 py-3 pr-14 text-sm transition-all resize-none',
              'bg-white dark:bg-zinc-900/60',
              'text-zinc-900 dark:text-zinc-100',
              'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
              errors.description
                ? 'border-red-500 focus:ring-red-500/40'
                : 'border-zinc-300 dark:border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/40',
              'focus:outline-none focus:ring-2',
            ].join(' ')}
          />
          <span
            className={[
              'absolute right-3 bottom-3 text-xs font-medium tabular-nums',
              DESC_MAX - description.length === 0
                ? 'text-red-500'
                : DESC_MAX - description.length <= 50
                  ? 'text-amber-500'
                  : 'text-zinc-400',
            ].join(' ')}
          >
            {DESC_MAX - description.length}
          </span>
        </div>
      </FormField>

      {/* Tags */}
      <FormField
        label="Tags"
        description="Add up to 3 tags for better discoverability"
        error={errors.tags}
      >
        <TagMultiCombo
          placeholder="Search tags..."
          maxCount={3}
          size="md"
          onChange={handleTagsChange}
          values={tags}
        />
      </FormField>

      {/* Info Note */}
      <InfoBox>
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <p>
            <strong className="font-medium">Tip:</strong> Clear names, concise
            descriptions, and relevant categories increase your event&apos;s
            visibility.
          </p>
        </div>
      </InfoBox>
    </EditSection>
  );
}
