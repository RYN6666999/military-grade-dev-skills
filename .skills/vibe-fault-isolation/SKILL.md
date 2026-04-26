---
name: vibe-fault-isolation
description: >
  Requires fault isolation for dynamic UI sections. A single component crash
  must not take down the full page. Use when writing or reviewing page
  components, layouts, or any component that fetches data or renders async
  content.
paths: apps/**/app/**/*.tsx, apps/**/components/**/*.tsx, packages/ui/**/*.tsx
---

# Fault Isolation — Section Crashes Must Be Contained

## Intent

A single failing async component, broken data fetch, or unexpected runtime
error must never take down the entire page. Fault isolation is a structural
requirement, not a defensive afterthought.

## What Requires Isolation

Any section that meets one or more of these criteria:

- Renders data from an external API, database, or Server Action
- Uses `Suspense` or `async` Server Components
- Is optional / non-critical to the core page function
- Has a realistic failure mode (third-party widget, user-generated content)
- Is below the fold or conditionally rendered

## Component API

### `FaultIsolatedSection` (from `@vibe/ui`)

```tsx
<FaultIsolatedSection
  enabled={boolean}                   // default: true. false → renders disabledFallback
  disabledFallback={<ReactNode />}    // shown when enabled=false (has default UI)
  errorFallback={<ReactNode />}       // shown when children throw at runtime (has default UI)
  className="..."
>
  {children}
</FaultIsolatedSection>
```

`enabled` is the only contract with the flags provider — wire it to Vercel Flags,
Unleash, or a plain boolean without changing this component.

### `DynamicSection` (from `@vibe/ui`)

```tsx
<DynamicSection
  fallback={<ReactNode />}   // default: <DefaultSkeleton />, pass null to opt out
  className="..."
>
  <YourAsyncServerComponent />
</DynamicSection>
```

Typical pattern: outer `FaultIsolatedSection` catches runtime errors,
inner `DynamicSection` handles Suspense loading state.

## Required Behavior

- MUST wrap qualifying async sections in `<FaultIsolatedSection>` from `@vibe/ui`.
- MUST use `<DynamicSection>` from `@vibe/ui` as the Suspense wrapper for
  async sections.
- MUST provide a meaningful `errorFallback` — not just `null`. Minimum: a
  message indicating the section failed to load.
- For pages with multiple independent data-fetching sections, MUST isolate
  each section independently.

## Forbidden Behavior

- MUST NOT leave async data-fetching components unwrapped at the page root.
- MUST NOT use `try/catch` that silently swallows errors and renders nothing.
- MUST NOT treat a top-level `layout.tsx` error boundary as sufficient
  coverage for all nested dynamic sections.
- MUST NOT throw from a Server Component without a corresponding `error.tsx`
  in the same route segment.

## Good Example

```tsx
import { DynamicSection, FaultIsolatedSection } from '@vibe/ui'

export default function DashboardPage() {
  return (
    <main>
      <HeroStats />

      <FaultIsolatedSection
        enabled={true}
        errorFallback={<p>Orders failed to load.</p>}
      >
        <DynamicSection>
          <RecentOrders />
        </DynamicSection>
      </FaultIsolatedSection>

      <FaultIsolatedSection
        enabled={true}
        errorFallback={<p>Activity feed unavailable.</p>}
      >
        <DynamicSection>
          <ActivityFeed />
        </DynamicSection>
      </FaultIsolatedSection>
    </main>
  )
}
```

## Bad Example

```tsx
// FORBIDDEN: no isolation — if RecentOrders throws, entire page crashes
export default function DashboardPage() {
  return (
    <main>
      <HeroStats />
      <RecentOrders />
      <ActivityFeed />
    </main>
  )
}
```

## Notes

- Static sections (no async, no external data) do not need isolation.
- `<DefaultSkeleton>` from `@vibe/ui` is the standard loading placeholder
  for `DynamicSection`.
