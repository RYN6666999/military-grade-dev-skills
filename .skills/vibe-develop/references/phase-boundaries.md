# Phase Boundaries

This repo is built in eight phases. Each phase is a deliberate gate.
Do not implement Phase N+1 content inside Phase N.

## Currently Active Phase: 5

## Phase Map

| Phase | Name | What belongs here |
|-------|------|-------------------|
| 0 | Skeleton | Turborepo, Next.js 16, TypeScript strict, Tailwind v4 |
| 1 | AI Rules | `.cursor/rules/` guardrails, `.skills/` |
| 2 | UI Core | `DynamicSection`, `FaultIsolatedSection`, `DefaultSkeleton` |
| 3 | Contracts | `@vibe/contracts`, Zod schemas, `gen:contracts`, `guard:contracts` |
| 4 | CI Guards | `guard:all`, GitHub Actions, `guard:ppr`, `guard:specs` |
| 5 | OpenSpec | spec-first workflow, change lifecycle, `openspec/` structure |
| 6 | Page Generator | CLI scaffolding for new routes and components |
| 7 | Observability | Audit log, traceability, MCP integration |
| 8 | Production | Deploy pipeline, release workflow, full CI hardening |

## Rules

- If a request touches a phase beyond the currently active phase, **flag it
  and do not implement**. Ask the user for explicit approval.
- Content from earlier phases (e.g., adding a new UI component in Phase 2
  while Phase 5 is active) is always allowed.
- `packages/machines/` is Phase 7+. Do not create state machines until
  Phase 7 is active.
- `packages/config/` is Phase 6+. Do not add shared config until Phase 6
  is active.

## Phase 6+ Content (needs approval before implementing)

| Package / Area | Phase |
|---------------|-------|
| `packages/machines/` — XState state machines | 7+ |
| `packages/config/` — shared ESLint/TS config | 6+ |
| Audit log MCP integration | 7+ |
| Deploy pipeline, release workflow | 8+ |
| next-safe-action, Orval | 8+ |
