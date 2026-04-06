// DefaultSkeleton: a domain-agnostic loading placeholder.
// Intentionally minimal — no business logic, no specific layout assumption.
// Consumers can compose or replace it via DynamicSection's fallback prop.

interface DefaultSkeletonProps {
  /** Number of shimmer rows to display. Defaults to 3. */
  rows?: number
  /** Accessible label for screen readers. */
  label?: string
}

export function DefaultSkeleton({
  rows = 3,
  label = 'Loading…',
}: DefaultSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className="w-full animate-pulse space-y-3 rounded-md p-4"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          // Vary width so the skeleton looks natural rather than uniform bars.
          className={[
            'h-4 rounded bg-zinc-800',
            i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-full' : 'w-1/2',
          ].join(' ')}
        />
      ))}
      {/* Hidden text for assistive technologies */}
      <span className="sr-only">{label}</span>
    </div>
  )
}
