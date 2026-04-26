---
name: vibe-contracts
description: >
  Enforces runtime validation contracts at all I/O boundaries. Use when writing
  or reviewing API routes, Server Actions, fetch calls, database queries, form
  parsing, or any code that crosses a trust boundary. Activated when working
  with files in app/api/, actions/, or lib/.
paths: apps/**/app/api/**, apps/**/actions/**, apps/**/lib/**
---

# Runtime Contracts — All I/O Boundaries

## Intent

TypeScript types are compile-time guarantees only. At any I/O boundary, the
type system cannot protect you. Unvalidated data entering the application at
runtime is a structural defect.

## What Counts as an I/O Boundary

- Next.js API Routes (`app/api/**/route.ts`)
- Next.js Server Actions (`'use server'` functions)
- `fetch()` calls consuming external APIs
- Database query results before being used as typed objects
- Form `FormData` parsing
- URL search params consumed as typed values
- WebSocket / SSE message payloads

## Required Behavior

- MUST validate all inputs and outputs at every I/O boundary listed above.
- Approved validation tools: **Zod** (`@vibe/contracts`), **next-safe-action**
  (Phase 8+), **Orval** (Phase 8+).
- All validation errors MUST be returned as structured responses, not thrown
  as unhandled exceptions.
- Server Action return types MUST be explicit — never `any` or implicit
  inference from unvalidated data.
- Import schemas from `@vibe/contracts`. Do not hand-write Zod schemas that
  duplicate an existing contract.

## Forbidden Behavior

- MUST NOT cast incoming request body directly:
  `const body = await req.json() as MyType` ← FORBIDDEN.
- MUST NOT use `any` to bypass validation at a boundary.
- MUST NOT skip validation because "this endpoint is internal".
- MUST NOT silently discard validation errors — always return a structured
  error response.

## Good Example

```ts
import { LoginInputSchema } from '@vibe/contracts'

export async function POST(req: Request) {
  const raw = await req.json()
  const result = LoginInputSchema.safeParse(raw)
  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 })
  }
  // result.data is now fully typed and validated
}
```

## Bad Example

```ts
// FORBIDDEN: direct cast, no runtime validation
export async function POST(req: Request) {
  const body = await req.json() as { email: string; password: string }
  await loginUser(body) // runtime shape is unknown
}
```

## Notes

- This rule applies even when the caller is trusted (same monorepo). Malformed
  data from bugs is equally dangerous as malicious input.
- Contract workflow is documented in `.skills/vibe-develop/references/contract-workflow.md`.
