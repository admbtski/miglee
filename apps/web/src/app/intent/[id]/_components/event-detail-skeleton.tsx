export function EventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 animate-pulse">
      {/* Back Navigation Skeleton */}
      <div className="border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <div className="h-5 w-48 bg-neutral-200 rounded dark:bg-neutral-700" />
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Hero Skeleton */}
        <div className="mb-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
            <div className="h-7 w-3/4 bg-neutral-200 rounded dark:bg-neutral-700 mb-3" />
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 bg-neutral-200 rounded-full dark:bg-neutral-700" />
              <div>
                <div className="h-3 w-20 bg-neutral-200 rounded dark:bg-neutral-700 mb-1" />
                <div className="h-4 w-28 bg-neutral-200 rounded dark:bg-neutral-700" />
              </div>
            </div>
            <div className="flex gap-3 mb-4">
              <div className="h-5 w-32 bg-neutral-200 rounded dark:bg-neutral-700" />
              <div className="h-5 w-24 bg-neutral-200 rounded dark:bg-neutral-700" />
              <div className="h-5 w-28 bg-neutral-200 rounded dark:bg-neutral-700" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-neutral-200 rounded-full dark:bg-neutral-700" />
              <div className="h-6 w-28 bg-neutral-200 rounded-full dark:bg-neutral-700" />
              <div className="h-6 w-20 bg-neutral-200 rounded-full dark:bg-neutral-700" />
            </div>
          </div>
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left Column */}
          <div className="space-y-6 min-w-0">
            <div className="rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
              <div className="h-6 w-1/3 bg-neutral-200 rounded dark:bg-neutral-700 mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-neutral-200 rounded dark:bg-neutral-700" />
                <div className="h-4 w-full bg-neutral-200 rounded dark:bg-neutral-700" />
                <div className="h-4 w-5/6 bg-neutral-200 rounded dark:bg-neutral-700" />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
              <div className="h-6 w-1/3 bg-neutral-200 rounded dark:bg-neutral-700 mb-4" />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-neutral-200 rounded-full dark:bg-neutral-700" />
                  <div className="h-4 w-24 bg-neutral-200 rounded dark:bg-neutral-700" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-neutral-200 rounded-full dark:bg-neutral-700" />
                  <div className="h-4 w-28 bg-neutral-200 rounded dark:bg-neutral-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
              <div className="h-6 w-1/2 bg-neutral-200 rounded dark:bg-neutral-700 mb-4" />
              <div className="h-12 w-full bg-neutral-200 rounded-xl dark:bg-neutral-700" />
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
              <div className="h-5 w-1/3 bg-neutral-200 rounded dark:bg-neutral-700 mb-3" />
              <div className="space-y-1">
                <div className="h-9 w-full bg-neutral-200 rounded-xl dark:bg-neutral-700" />
                <div className="h-9 w-full bg-neutral-200 rounded-xl dark:bg-neutral-700" />
                <div className="h-9 w-full bg-neutral-200 rounded-xl dark:bg-neutral-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
