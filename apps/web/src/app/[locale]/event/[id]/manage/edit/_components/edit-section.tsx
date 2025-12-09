'use client';

// TODO i18n: button labels ("Saving...", "Saved!", "Save Changes")

import { ReactNode, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

import { ManagementPageLayout } from '../../_components/management-page-layout';

interface EditSectionProps {
  title: string;
  description: string;
  children: ReactNode;
  onSave: () => Promise<boolean>;
  isDirty: boolean;
  isLoading?: boolean;
}

/**
 * Wrapper component for each edit section
 * Uses ManagementPageLayout for consistent styling with other manage pages
 * Has Save button both in header and bottom-right of content
 */
export function EditSection({
  title,
  description,
  children,
  onSave,
  isDirty,
  isLoading = false,
}: EditSectionProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave();
    setIsSaving(false);

    if (success) {
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  const SaveButton = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
    <button
      type="button"
      onClick={handleSave}
      disabled={!isDirty || isSaving}
      className={[
        'flex items-center gap-2 font-medium rounded-xl transition-all',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        isDirty && !isSaving && !justSaved
          ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'
          : justSaved
            ? 'bg-emerald-600 text-white'
            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-500',
      ].join(' ')}
    >
      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
      {justSaved && <Check className="w-4 h-4" />}
      <span>
        {isSaving ? 'Saving...' : justSaved ? 'Saved!' : 'Save Changes'}
      </span>
    </button>
  );

  if (isLoading) {
    return (
      <ManagementPageLayout title={title} description={description}>
        <div className="p-6 bg-white rounded-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>
      </ManagementPageLayout>
    );
  }

  return (
    <ManagementPageLayout
      title={title}
      description={description}
      actions={<SaveButton />}
    >
      <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="space-y-6">{children}</div>

        {/* Bottom Save Button */}
        <div className="flex justify-end mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <SaveButton />
        </div>
      </div>
    </ManagementPageLayout>
  );
}

/**
 * Form field wrapper with label and error handling
 */
interface FormFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({
  label,
  description,
  required,
  error,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
        {description && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>

      {children}

      {hint && !error && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Info box for tips and notes
 */
interface InfoBoxProps {
  children: ReactNode;
  variant?: 'info' | 'warning' | 'success';
}

export function InfoBox({ children, variant = 'info' }: InfoBoxProps) {
  const colors = {
    info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-100',
    warning:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-100',
    success:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-100',
  };

  return (
    <div className={`p-4 rounded-xl border text-sm ${colors[variant]}`}>
      {children}
    </div>
  );
}
