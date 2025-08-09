export default function Home() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6">
      <div className="max-w-3xl text-center">
        <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium ring-1 ring-inset ring-blue-200">
          Legal Assistant
        </span>
        <h1 className="mt-4 text-4xl md:text-6xl font-bold tracking-tight">
          Draft, review, and organize legal docs faster.
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          A modern Next.js app scaffolded with Tailwind CSS and shadcn/ui. Deploy-ready on Vercel.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href="/dashboard"
            className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-white font-medium shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Open Dashboard
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border px-5 py-2.5 font-medium hover:bg-gray-50 dark:hover:bg-zinc-900"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
