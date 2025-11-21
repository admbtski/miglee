'use client';

import { ReactNode } from 'react';
import { Save } from 'lucide-react';

interface EditStepLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  onSave: () => void | Promise<void>;
  isSaving?: boolean;
}

/**
 * Layout wrapper for edit steps
 * Each step can be saved independently
 */
export function EditStepLayout({
  title,
  description,
  children,
  onSave,
  isSaving = false,
}: EditStepLayoutProps) {
  const handleSave = async () => {
    await onSave();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>

      {/* Content */}
      <div className="space-y-6">{children}</div>

      {/* Save button */}
      <div className="flex justify-end border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50
                     bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-500 hover:to-violet-500
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                     transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSaving ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
