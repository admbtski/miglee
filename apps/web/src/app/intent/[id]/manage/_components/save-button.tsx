import { Save } from 'lucide-react';

interface SaveButtonProps {
  onClick: () => void;
  isSaving: boolean;
  isDirty?: boolean;
  label?: string;
}

export function SaveButton({
  onClick,
  isSaving,
  isDirty = true,
  label = 'Save Changes',
}: SaveButtonProps) {
  const isDisabled = isSaving || !isDirty;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50
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
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
