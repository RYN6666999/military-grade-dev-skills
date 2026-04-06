# Proposal: bootstrap-contract-infra

## What

Establish the contract layer infrastructure for the Vibe Coding Template:
a spec-driven pipeline that generates runtime-validated Zod schemas from
structured spec files and verifies them with a semantic smoke runner.

## Why

TypeScript types are compile-time guarantees only. At any I/O boundary —
API routes, Server Actions, external fetches, FormData — the type system
offers no runtime protection. This change establishes the tooling that
bridges the gap:

- **Spec files** are the single source of truth for I/O shapes.
- **Generated contracts** (`*.contract.ts`) are the runtime enforcement layer.
- **Semantic verification** (`guard:contracts`) confirms that valid examples
  parse and invalid examples fail — proving the schema actually works.

Without this infrastructure, any AI-generated code touching an I/O boundary
can silently introduce unvalidated data paths, violating the `contract-required`
rule established in Phase 1.

## Scope

- `packages/contracts/` package (Zod dependency, tsconfig, barrel export)
- `scripts/spec-to-contract.mjs` — template-based generator
- `scripts/verify-contracts.mjs` — semantic smoke runner
- `specs/` format definition (frontmatter + JSON section blocks)
- First contract: `auth/login` (LoginInput, LoginSuccess, LoginError schemas)
- Root scripts: `gen:contracts`, `guard:contracts`

## Out of Scope

- Real auth implementation (no API routes, no Server Actions)
- next-safe-action / Orval integration (Phase 8+)
- Full test suite for contracts (Phase 6+)
- Contract versioning or migration tooling
