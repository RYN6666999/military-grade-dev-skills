'use client'

// FaultIsolatedSection: combines a feature gate (enabled/disabled) with a
// client-side Error Boundary so that a single section crash cannot take
// down the full page.
//
// Design goals:
//   1. Provider-agnostic — the `enabled` prop is the only contract.
//      Wire it to Vercel Flags, Unleash, LaunchDarkly, or a plain boolean
//      without changing this component.
//   2. Explicit fallbacks for both the "disabled" and "error" states.
//   3. Zero third-party dependencies — the Error Boundary is a minimal
//      class component so we stay lightweight in Phase 2.

import React, { type ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Feature gate contract (provider-agnostic stub)
// ---------------------------------------------------------------------------

/**
 * Minimal feature gate interface.
 * In Phase 3+ this will be resolved by a real flags provider (Vercel Flags,
 * Unleash, LaunchDarkly…). For now, pass a plain boolean as `enabled`.
 *
 * @example
 *   <FaultIsolatedSection enabled={myFlag}>…</FaultIsolatedSection>
 */
export interface FeatureGate {
  enabled: boolean
}

// ---------------------------------------------------------------------------
// Minimal Error Boundary (class component — required by React)
// ---------------------------------------------------------------------------

interface BoundaryState {
  hasError: boolean
  error: Error | null
}

interface BoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

class MinimalErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, error }
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// ---------------------------------------------------------------------------
// Default fallback UIs
// ---------------------------------------------------------------------------

function DefaultDisabledFallback() {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-500">
      This section is currently disabled.
    </div>
  )
}

function DefaultErrorFallback() {
  return (
    <div className="rounded-md border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">
      This section failed to load. The rest of the page is unaffected.
    </div>
  )
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface FaultIsolatedSectionProps {
  /**
   * Whether this section is enabled.
   * False → renders disabledFallback without mounting children at all.
   * True + runtime error → renders errorFallback.
   *
   * In Phase 3+, resolve this from your flags provider before passing it in.
   */
  enabled?: boolean
  /** Rendered when enabled=false. Defaults to a minimal "disabled" notice. */
  disabledFallback?: ReactNode
  /**
   * Rendered when enabled=true but children throw at runtime.
   * Defaults to a minimal error notice.
   */
  errorFallback?: ReactNode
  children: ReactNode
  /** Forwarded to the wrapping <div> for layout purposes. */
  className?: string
}

export function FaultIsolatedSection({
  enabled = true,
  disabledFallback = <DefaultDisabledFallback />,
  errorFallback = <DefaultErrorFallback />,
  children,
  className,
}: FaultIsolatedSectionProps) {
  if (!enabled) {
    return <div className={className}>{disabledFallback}</div>
  }

  return (
    <div className={className}>
      <MinimalErrorBoundary fallback={errorFallback}>
        {children}
      </MinimalErrorBoundary>
    </div>
  )
}
