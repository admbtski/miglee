export function EventDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 animate-pulse">
      {/* Hero Skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
        <div className="h-8 w-3/4 bg-gray-200 rounded dark:bg-gray-700 mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full dark:bg-gray-700" />
          <div className="h-4 w-32 bg-gray-200 rounded dark:bg-gray-700" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-gray-200 rounded dark:bg-gray-700" />
          <div className="h-6 w-24 bg-gray-200 rounded dark:bg-gray-700" />
        </div>
      </div>

      {/* Content Grid Skeleton */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
            <div className="h-6 w-32 bg-gray-200 rounded dark:bg-gray-700 mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded dark:bg-gray-700" />
              <div className="h-4 w-full bg-gray-200 rounded dark:bg-gray-700" />
              <div className="h-4 w-2/3 bg-gray-200 rounded dark:bg-gray-700" />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
            <div className="h-10 w-full bg-gray-200 rounded dark:bg-gray-700 mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded dark:bg-gray-700" />
              <div className="h-4 w-3/4 bg-gray-200 rounded dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
