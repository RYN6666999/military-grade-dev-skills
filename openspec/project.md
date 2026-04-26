# Vibe Coding Template — Project Baseline

> This document is the source-of-truth baseline for AI assistants and engineers
> working in this repo. It is not a README or marketing page.
> Read it before proposing or implementing any change.

---

## Project Overview

A production-grade frontend monorepo template that applies high-ROI reliability
patterns from aerospace/defense software engineering to modern AI-assisted
(Vibe Coding) workflows.

The goal is not to ship features. The goal is to establish a foundation where:
- AI-generated code is constrained by explicit, enforceable rules.
- Every I/O boundary has a runtime contract, not just a TypeScript type.
- Any component failure is locally isolated — one crash cannot take down a page.
- Every change is traceable from spec to implementation to guard to archive.

---

## Core Philosophy

These seven principles are non-negotiable. They are enforced at the skills layer
(`.skills/`), the guard layer (`guard:all`), and the spec layer (OpenSpec).

| # | Principle | Enforcement |
|---|---|---|
| 1 | No spec, no code | `.skills/vibe-spec-first/SKILL.md`, `/opsx:propose` |
| 2 | All I/O boundaries must have runtime contracts | `.skills/vibe-contracts/SKILL.md`, `guard:contracts` |
| 3 | The AI that writes is not the AI that reviews | `.skills/vibe-scope-control/SKILL.md` |
| 4 | Any section crash must not take down the full page | `.skills/vibe-fault-isolation/SKILL.md`, `FaultIsolatedSection` |
| 5 | Every AI output must be traceable | `.skills/vibe-scope-control/SKILL.md`, OpenSpec change lifecycle |
| 6 | Quality checks must be automatable | `guard:all`, `.github/workflows/guard.yml` |
| 7 | More than 3 related useState → state machine | `.skills/vibe-state-management/SKILL.md` |

---

## Architecture Principles

### Eight-Phase Build Sequence

This repo is built in eight phases. Each phase is a deliberate gate.
Do not implement Phase N+1 content inside Phase N.

| Phase | Name | Core Deliverable |
|---|---|---|
| 0 | Skeleton | Turborepo, Next.js 16, TypeScript strict, Tailwind v4 |
| 1 | AI Rules | `.skills/` — 9 agent-agnostic SKILL.md guardrails, `.cursor/rules/vibe-skills-bridge.mdc` |
| 2 | UI Core | `DynamicSection`, `FaultIsolatedSection`, `DefaultSkeleton` |
| 3 | Contracts | `@vibe/contracts`, Zod schemas, `gen:contracts`, `guard:contracts` |
| 4 | CI Guards | `guard:all`, GitHub Actions, `guard:ppr` |
| 5 | OpenSpec | This phase — spec-first main trunk, change lifecycle |
| 6 | Page Generator | CLI scaffolding for new routes and components |
| 7 | Observability | Audit log, traceability, MCP integration |
| 8 | Production | Deploy pipeline, release workflow, full CI hardening |

### Monorepo Structure

```
apps/web/          Next.js 16 App Router application
packages/ui/       Shared React components (@vibe/ui)
packages/contracts/ Zod runtime schemas (@vibe/contracts)
packages/machines/ XState state machines — Phase 7+ placeholder, currently empty (@vibe/machines)
packages/config/   Shared tooling config — Phase 6+ placeholder, currently empty (@vibe/config)
openspec/          Spec-first change management
scripts/           Build and guard automation
.skills/           Agent-agnostic behavioral guardrails (SKILL.md format)
.cursor/rules/     Cursor adapter — single bridge file pointing to .skills/
.github/workflows/ CI guard pipeline
```

> **Note on empty packages**: `@vibe/machines` and `@vibe/config` are deliberate
> Phase 6+/7+ placeholders. They exist in the monorepo now so Turborepo task
> graphs are pre-wired. Having no source files is intentional and expected
> at Phase 5. Do not add code to them until the corresponding phase is active.

### Key Technical Constraints

- **Next.js 16** — App Router only. `cacheComponents: true` must remain enabled.
  Verified by `guard:ppr` on every CI run.
- **TypeScript strict** — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride` are all active. `any` is forbidden.
- **Tailwind CSS v4** — CSS-first, `@import "tailwindcss"`, no `tailwind.config.ts`.
- **Turborepo** — All cross-package tasks run through `turbo`. Do not bypass it.
- **React 19.2** — Server Components, Suspense, and `use cache` are first-class.
  Do not add `'use client'` to components that do not need it.

---

## Technical Baseline

### Contract Layer

All I/O boundaries must use contracts from `@vibe/contracts`.

The lifecycle is: **spec → generate → verify → implement**.

```bash
# 1. Write or update a spec in openspec/changes/<name>/specs/
# 2. Generate the Zod schema
npm run gen:contracts
# 3. Verify semantic correctness
npm run guard:contracts
# 4. Then implement against the generated types
```

Contracts are generated from specs. Never hand-edit `*.contract.ts` files.
The source of truth is always the spec in `openspec/changes/<name>/specs/`.

Approved validation tools: **Zod**, **next-safe-action** (Phase 8+), **Orval** (Phase 8+).

### UI Layer

| Component | Package | Purpose |
|---|---|---|
| `DynamicSection` | `@vibe/ui` | Standardizes Suspense wrapper for async sections |
| `FaultIsolatedSection` | `@vibe/ui` | Feature gate + error boundary, provider-agnostic |
| `DefaultSkeleton` | `@vibe/ui` | Domain-agnostic loading placeholder |

`FaultIsolatedSection.enabled` is the only contract with the flags provider.
Wire it to Vercel Flags, Unleash, or a plain boolean — the component does not care.

### State Management

| Situation | Pattern |
|---|---|
| ≤ 2 independent state values | `useState` |
| 3+ related state values | `useReducer` with typed actions |
| Mutually exclusive states (idle/loading/success/error) | Discriminated union, never parallel booleans |
| Cross-component or complex lifecycle | `@vibe/machines` (Phase 7+) |

---

## Change Workflow

Every feature, fix, or refactor starts with a change proposal. No spec, no code.

### Full Lifecycle

```
/opsx:propose "<idea>"
→ Edit proposal.md, design.md, specs/
→ npm run guard:specs            (validate spec format before generating)
→ npm run gen:contracts          (if contract changes are involved)
→ npm run guard:contracts        (verify contract integrity)
→ Implementation
→ npm run guard:all              (full local guard pass)
→ /opsx:archive                 (move to openspec/changes/archive/)
```

### When to Propose

- Adding a new route, page, or feature
- Modifying any API boundary or Server Action
- Adding or changing a Zod contract
- Any change touching > 1 package

### When Not to Propose

- Fixing a typo or copy
- Updating a comment
- Bumping a dependency patch version

---

## Contract Workflow

Detailed steps for contract-related changes:

```bash
# Create or update a spec (in openspec/changes/<name>/specs/<domain>/)
# Spec format: frontmatter + ## input / ## success / ## error / ## examples

npm run gen:contracts            # Parse spec → generate *.contract.ts
npm run guard:contracts          # Semantic smoke: valid parse / invalid fail

# Implement against LoginInput, LoginSuccess, LoginError types
# Do not cast: const body = await req.json() as LoginInput  ← FORBIDDEN
# Do use:      const result = LoginInputSchema.safeParse(raw)
```

---

## Guard Workflow

```bash
npm run guard:all       # specs + types + lint + contracts + ppr (local, fast)
npm run guard:specs     # Spec frontmatter + section structure + JSON validity
npm run guard:types     # TypeScript strict across all workspaces
npm run guard:lint      # ESLint baseline
npm run guard:contracts # Contract semantic smoke
npm run guard:ppr       # Verify cacheComponents: true exists
npm run build           # Full Next.js build (run before PR, always in CI)
```

CI runs `guard:all` + `build` on every push and pull_request.
Any failure blocks the workflow. There are no warnings-only steps.

---

## Phase Boundaries

When asked to implement something, verify which phase it belongs to before starting.

**Currently active: Phase 5**

| Belongs to | Examples |
|---|---|
| Phase 2 | New shared UI components in `@vibe/ui` |
| Phase 3 | New Zod contracts, new spec files |
| Phase 4 | New guard scripts, CI workflow changes |
| Phase 5 | OpenSpec changes, project.md, change lifecycle |
| Phase 6+ | CLI scaffolding, audit log, MCP, deploy pipeline |

If a request touches Phase 6+ content, flag it and do not implement without explicit approval.
