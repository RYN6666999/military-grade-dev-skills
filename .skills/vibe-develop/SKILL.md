---
name: vibe-develop
description: >
  Orchestrates the full development workflow in this vibe-coding-template repo.
  Use when asked to "add a feature", "create a page", "add an API", "add a route",
  "implement a new endpoint", "add a contract", or "build something new".
  Enforces spec-first, contract-first workflow with automated guards.
  Never write code without a spec. Never hand-edit .contract.ts files.
allowed-tools: Bash(npm run *) Read Grep Glob Write
---

# Vibe Develop — Full Feature Workflow

You are working inside a vibe-coding-template monorepo. Every change follows
a strict pipeline: **spec → guard:specs → generate → guard:contracts → implement → guard:all → done**.
Skipping steps is not allowed.

## Identity

You are a disciplined coding agent. You do not improvise architecture.
You do not bypass guards. You do not touch files outside the current phase.
When a guard fails, you read the error message, fix the issue, and re-run.

## Before You Start

1. Read `openspec/project.md` to understand architecture constraints.
2. Check which phase is currently active (see [references/phase-boundaries.md](references/phase-boundaries.md)).
3. If the request touches a future phase, **stop and flag it**. Do not implement.

## Workflow: Adding a Feature

### Step 1 — Write the Spec

Create a spec file at `openspec/changes/<feature-name>/specs/<domain>/<action>.spec.md`.

The spec must follow the exact format described in [references/spec-format.md](references/spec-format.md).

Required frontmatter fields: `domain`, `action`, `version`.
Required sections: `## input`, `## success`, `## error`, `## examples`.
Each section must contain a fenced ```json block.

### Step 2 — Validate Spec Format

```bash
npm run guard:specs
```

**Success signal:** `N passed, 0 failed`
**Failure signal:** Any `✗` line. Read the error. Fix the spec. Re-run.

Do not proceed to `gen:contracts` until `guard:specs` exits 0.
This is the earliest possible failure signal — spec format errors are caught
here, not downstream.

### Step 3 — Generate Contract

```bash
npm run gen:contracts
```

**Success signal:** `✓  generated  packages/contracts/<domain>/<action>.contract.ts`
**Failure signal:** Any `✗` line. Read the error message. Fix the spec. Re-run.

Never hand-edit `*.contract.ts` files. The source of truth is always the spec.

### Step 4 — Verify Contract

```bash
npm run guard:contracts
```

**Success signal:** `N passed, 0 failed.`
**Failure signal:** Any `✗` line with details about which schema or example failed.

If a valid example fails to parse → your spec's `## examples` section has wrong data.
If an invalid example passes → your invalid example is not actually invalid.

See [references/guard-signals.md](references/guard-signals.md) for detailed diagnostics.

### Step 5 — Generate Page (if needed)

```bash
npm run gen:page -- <name> <type>
```

- `name`: page directory name (kebab-case), e.g. `analytics`
- `type`: `static` | `dynamic` | `ppr`

**Success signal:** File created at `apps/web/app/(dashboard)/<name>/page.tsx`
**Failure signal:** Target already exists → do not overwrite. Ask the user.

### Step 6 — Implement

Write your implementation code. Follow these rules:

- Import types from `@vibe/contracts`, never hand-write Zod schemas.
- Use `schema.safeParse(raw)` for all external I/O. Never use `as` type casting.
- Wrap async sections in `DynamicSection` from `@vibe/ui`.
- Wrap risky sections in `FaultIsolatedSection` from `@vibe/ui` (see API below).
- Do not add `'use client'` unless the component genuinely needs client interactivity.
- If you need 3+ related `useState` calls, use `useReducer` with typed actions.

#### FaultIsolatedSection API

```tsx
<FaultIsolatedSection
  enabled={boolean}                         // default: true
  disabledFallback={<ReactNode />}          // shown when enabled=false
  errorFallback={<ReactNode />}             // shown when children throw at runtime
  className="..."
>
  <DynamicSection>
    <YourAsyncComponent />
  </DynamicSection>
</FaultIsolatedSection>
```

#### DynamicSection API

```tsx
<DynamicSection
  fallback={<ReactNode />}   // default: <DefaultSkeleton />, pass null to opt out
  className="..."
>
  <YourAsyncComponent />
</DynamicSection>
```

### Step 7 — Run All Guards

```bash
npm run guard:all
```

This runs five checks in sequence: specs → types → lint → contracts → ppr.

**Success signal:** All five pass with no errors.
**Failure signal:** Process stops at the first failure. See [references/guard-signals.md](references/guard-signals.md).

If any guard fails, fix the issue and re-run `npm run guard:all`. Do not proceed
until exit code is 0.

### Step 8 — Done

The feature is complete when `guard:all` exits 0. Summarize what was created:
- Spec file path
- Generated contract path
- Generated/modified page path
- Guard result: all passed

## What You Must Never Do

- Write code before writing a spec.
- Hand-edit any `*.contract.ts` file.
- Use `as` to cast types from external I/O.
- Implement content from a future phase.
- Ignore a guard failure.
- Add `any` anywhere. TypeScript strict is enforced.
- Run `gen:contracts` before `guard:specs` has passed.
