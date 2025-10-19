export default function IntentsPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Intents</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage automations and saved flows.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {['Job search', 'Daily summary', 'Code review'].map((name) => (
          <div
            key={name}
            className="p-4 border rounded-2xl border-zinc-200 bg-white/90 dark:border-zinc-700 dark:bg-zinc-900/50"
          >
            <div className="text-sm font-semibold">{name}</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Short description of the intent / recipe.
            </p>
            <div className="flex gap-2 mt-3">
              <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/60">
                Edit
              </button>
              <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">
                Run
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
