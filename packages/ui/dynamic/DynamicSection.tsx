// DynamicSection: standardizes the Suspense wrapper pattern for streaming / dynamic holes.
//
// Goals:
//   1. Single, consistent API for every async Server Component section.
//   2. Forces explicit fallback consideration at every call site.
//   3. Compatible with Next.js 16 App Router + cacheComponents streaming.
//
// This file intentionally has no 'use client' — it is a Server Component
// (or used inside one). The children prop carries async Server Components.

import { Suspense, type ReactNode } from 'react'
import { DefaultSkeleton } from '../skeletons/DefaultSkeleton'

interface DynamicSectionProps {
  /** The async Server Component (or any suspending subtree) to stream in. */
  children: ReactNode
  /**
   * Fallback shown while children suspend.
   * Defaults to <DefaultSkeleton /> so every dynamic hole has a visual placeholder.
   * Pass null explicitly to opt out of the default skeleton.
   */
  fallback?: ReactNode
  /** Forwarded to the wrapping <div> for layout purposes. */
  className?: string
}

export function DynamicSection({
  children,
  fallback = <DefaultSkeleton />,
  className,
}: DynamicSectionProps) {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </div>
  )
}
