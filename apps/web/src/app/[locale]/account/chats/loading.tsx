/**
 * Chats Loading State
 *
 * Displayed while chat data is being fetched
 */

// TODO i18n: title, description, loading text

export default function ChatsLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        {/* TODO i18n */}
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Czaty
        </h1>
        <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
          Ładowanie konwersacji...
        </p>
      </div>

      {/* Chat Shell Skeleton */}
      <div className="w-full">
        <div className="hidden md:grid md:h-[600px] md:grid-cols-[clamp(260px,20vw,360px)_minmax(0,1fr)] md:gap-6">
          {/* List Pane Skeleton */}
          <aside className="rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 animate-pulse">
            {/* Tabs Skeleton */}
            <div className="grid grid-cols-2 gap-2 p-1 mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <div className="h-9 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-9 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            </div>

            {/* Conversations List Skeleton */}
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-3 w-36 rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                  <div className="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
              ))}
            </div>
          </aside>

          {/* Thread Pane Skeleton */}
          <section className="rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col animate-pulse">
            {/* Thread Header Skeleton */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>

            {/* Messages Area Skeleton */}
            <div className="flex-1 p-4 space-y-4 overflow-hidden">
              {/* Left message */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-16 w-48 rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>

              {/* Right message */}
              <div className="flex items-start gap-3 flex-row-reverse">
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="space-y-2 items-end">
                  <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700 ml-auto" />
                  <div className="h-12 w-64 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30" />
                </div>
              </div>

              {/* Left message */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-24 w-56 rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
            </div>

            {/* Input Area Skeleton */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          </section>
        </div>

        {/* Mobile View Skeleton */}
        <div className="md:hidden">
          <aside className="rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 animate-pulse">
            {/* Tabs Skeleton */}
            <div className="grid grid-cols-2 gap-2 p-1 mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <div className="h-9 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-9 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            </div>

            {/* Conversations List Skeleton */}
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-3 w-36 rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                  <div className="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
