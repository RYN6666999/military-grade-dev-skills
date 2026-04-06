// Demo route: /demo/resilience
//
// Verifies that Phase 2 components are wired correctly:
//   1. DynamicSection — Suspense wrapper with DefaultSkeleton fallback
//   2. FaultIsolatedSection — feature gate + error isolation
//   3. DefaultSkeleton — standalone visual check
//
// This page is intentionally minimal. It is NOT a design showcase.

import { DynamicSection } from '@vibe/ui/dynamic/DynamicSection'
import { FaultIsolatedSection } from '@vibe/ui/resilient/FaultIsolatedSection'
import { DefaultSkeleton } from '@vibe/ui/skeletons/DefaultSkeleton'

// ---------------------------------------------------------------------------
// Simulated async Server Components
// ---------------------------------------------------------------------------

// Simulates a section that loads successfully after a short delay.
async function SlowContent() {
  // In a real app this would be a DB query or fetch call.
  await new Promise<void>((resolve) => setTimeout(resolve, 800))
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
      Async content loaded successfully after 800 ms.
    </div>
  )
}

// Simulates a section that always throws at runtime.
// Return type is Promise<never> because this function never resolves successfully.
async function BrokenContent(): Promise<never> {
  await new Promise<void>((resolve) => setTimeout(resolve, 200))
  throw new Error('Simulated section failure')
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ResilienceDemoPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-10 p-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-50">Resilience Demo</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Phase 2 — DynamicSection · FaultIsolatedSection · DefaultSkeleton
        </p>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 1. DefaultSkeleton — standalone display                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          1 · DefaultSkeleton (standalone)
        </h2>
        <DefaultSkeleton rows={4} label="Example skeleton" />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. DynamicSection — Suspense with DefaultSkeleton fallback         */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          2 · DynamicSection (async content, 800 ms delay)
        </h2>
        <DynamicSection>

          <SlowContent />
        </DynamicSection>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. FaultIsolatedSection — enabled, content throws                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          3 · FaultIsolatedSection (enabled, content throws)
        </h2>
        {/* DynamicSection provides the Suspense boundary required by cacheComponents. */}
        {/* FaultIsolatedSection provides the error boundary around the async child.   */}
        <FaultIsolatedSection enabled>
          <DynamicSection>
            <BrokenContent />
          </DynamicSection>
        </FaultIsolatedSection>
        <p className="text-xs text-zinc-600">
          ↑ Error is caught locally. Sections 1, 2, and 4 are unaffected.
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. FaultIsolatedSection — disabled via feature gate                */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          4 · FaultIsolatedSection (enabled=false, feature gate off)
        </h2>
        {/* DynamicSection provides the Suspense boundary required by cacheComponents. */}
        <FaultIsolatedSection enabled={false}>
          <DynamicSection>
            <SlowContent />
          </DynamicSection>
        </FaultIsolatedSection>
        <p className="text-xs text-zinc-600">
          ↑ Children never mount. Disabled fallback is shown instead.
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. DynamicSection — custom fallback                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          5 · DynamicSection (custom fallback prop)
        </h2>
        <DynamicSection
          fallback={
            <div className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-500">
              Custom fallback — overrides DefaultSkeleton…
            </div>
          }
        >

          <SlowContent />
        </DynamicSection>
      </section>
    </main>
  )
}
