export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        This is the main application shell. Authentication can be added later.
      </p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Recent Docs</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No documents yet.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Tasks</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No tasks yet.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Notes</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Keep track of your work.</p>
        </div>
      </div>
    </main>
  );
}
