/**
 * Chats Loading State
 *
 * Displayed while chat data is being fetched
 */

// TODO: add translation (i18n) - "Chats", "Loading your conversations...", "Loading chats..."

export default function ChatsLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {/* TODO: add translation (i18n) */}
          Chats
        </h1>
        <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
          {/* TODO: add translation (i18n) */}
          Loading your conversations...
        </p>
      </div>

      {/* Loading skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              {/* TODO: add translation (i18n) */}
              Loading chats...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
