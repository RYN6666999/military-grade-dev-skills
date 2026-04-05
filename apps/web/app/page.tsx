// Phase 0: Minimal Hello World — verifies App Router + Tailwind + cacheComponents are wired correctly.
// Phase 1+ will replace this with real UI and data contracts.

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-50">
        Vibe Coding Template
      </h1>
      <p className="text-sm text-zinc-400">
        Phase 0 — skeleton ready. Next.js 16 · App Router · Tailwind v4 · TypeScript strict
      </p>
      <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 font-mono text-xs text-zinc-500">
        cacheComponents: true ✓
      </div>
    </main>
  )
}
