# AGENTS.md — Coding Agent Operating Protocol

> Machine-readable protocol for any coding agent working in this repository.
> Read this before writing any code. All constraints here are enforced by the
> guard pipeline — violations will be caught before merge.

---

## Identity

You are a coding agent operating inside a Harness Engineering environment.
Your job is to implement changes that are:
- Traceable (spec → contract → implementation → audit)
- Verifiable (every step has a deterministic pass/fail signal)
- Isolated (component failures do not cascade)

You do not ship features. You ship changes that pass the guard pipeline.

---

## Available Tools

Each command below is an atomic operation with defined inputs, outputs, and
exit code semantics. Use them in the order specified by the workflow.

### Guard Tools (verification — run before and after every change)

| Command | Purpose | Exit 0 | Exit 1 |
|---|---|---|---|
| `npm run guard:specs` | Spec format validation | All specs have valid frontmatter + sections + JSON | Any spec has structural errors |
| `npm run guard:contracts` | Contract semantic smoke test | All valid examples parse; all invalid examples fail | Schema mismatch or missing examples |
| `npm run guard:types` | TypeScript strict check | Zero type errors across all packages | Type errors exist |
| `npm run guard:lint` | ESLint baseline | Zero lint errors | Lint errors exist |
| `npm run guard:ppr` | PPR configuration check | `cacheComponents: true` present in next.config.ts | Missing or disabled |
| `npm run guard:all` | Full pipeline (all above in sequence) | All guards pass | First failing guard stops the chain |

**Policy**: `guard:all` must exit 0 before any change is considered complete.
If `guard:all` exits non-zero, read stderr, fix the root cause, and re-run.
Never suppress or skip a failing guard.

### Generator Tools (scaffolding — run when creating new artifacts)

| Command | Input | Output | Guard to run after |
|---|---|---|---|
| `npm run gen:contracts` | `*.spec.md` files under `openspec/changes/*/specs/` | `packages/contracts/{domain}/{action}.contract.ts` | `guard:contracts` |
| `npm run gen:page [name] [type]` | Route name (kebab-case), type (`static`/`dynamic`/`ppr`) | `apps/web/app/(dashboard)/{name}/page.tsx` | `guard:types` |

**Policy**: Never hand-edit generated `*.contract.ts` files. The source of truth
is the spec. Edit the spec, then re-run `gen:contracts`.

### Audit Tools (traceability — optional but recommended)

| Command | Purpose |
|---|---|
| `npm run audit:gen:contracts` | Audited wrapper for `gen:contracts` — writes to `audit.jsonl` |
| `npm run audit:gen:page` | Audited wrapper for `gen:page` |
| `npm run audit:guard:all` | Audited wrapper for `guard:all` |
| `npm run audit:verify` | Validates audit log structure |

---

## Workflow

The mandatory sequence for every change. Do not skip steps.

```
1. WRITE SPEC
   Create or update: openspec/changes/<change-name>/specs/<domain>/<action>.spec.md
   Required frontmatter: domain, action, version
   Required sections: ## input, ## success, ## error, ## examples

2. VALIDATE SPEC
   npm run guard:specs
   → Exit 1: fix spec format errors before proceeding. Do not run gen:contracts
     on a spec that fails guard:specs.

3. GENERATE CONTRACT (if spec is new or changed)
   npm run gen:contracts
   → Exit 1: spec has structural issues not caught by guard:specs (rare).
     Fix the reported error and re-run.

4. VERIFY CONTRACT
   npm run guard:contracts
   → Exit 1: valid examples don't parse, or invalid examples pass when they
     shouldn't. Fix the spec's ## examples section, then re-run steps 3–4.

5. IMPLEMENT
   Write application code against the generated TypeScript types.
   Import from @vibe/contracts — do not re-define schemas inline.
   Use LoginInputSchema.safeParse(raw) — never cast with `as LoginInput`.

6. FULL GUARD PASS
   npm run guard:all
   → Exit 1: read stderr carefully. The failing guard name tells you which
     layer is broken. Fix only the reported issue. Re-run guard:all.
     Repeat until exit 0.

7. DONE
   Change is complete when guard:all exits 0 with no warnings.
```

### State Machine (simplified)

```
IDLE
  → write spec
SPEC_WRITTEN
  → guard:specs passes → SPEC_VALID
  → guard:specs fails  → SPEC_WRITTEN (fix and retry)
SPEC_VALID
  → gen:contracts      → CONTRACT_GENERATED
CONTRACT_GENERATED
  → guard:contracts passes → CONTRACT_VALID
  → guard:contracts fails  → SPEC_VALID (fix spec examples, re-gen)
CONTRACT_VALID
  → implement          → IMPL_DONE
IMPL_DONE
  → guard:all passes   → DONE
  → guard:all fails    → IMPL_DONE (fix reported issue, re-run)
DONE
```

---

## Constraints — What You Must Not Do

These are enforced at the guard and rules layers. Violations will be caught.

| Forbidden | Reason | Enforcer |
|---|---|---|
| Skip spec, write code directly | Breaks traceability | `spec-first.mdc`, `guard:specs` |
| Hand-edit `*.contract.ts` | Contract is generated; edits will be overwritten | Convention |
| Use TypeScript `as` for I/O casting | Bypasses runtime validation | `contract-required.mdc` |
| Use `any` type | Defeats strict mode | `tsconfig.json`, `guard:types` |
| Add `'use client'` without need | Breaks Server Component optimization | `error-boundary.mdc` |
| Implement Phase 6+ content without approval | Out-of-scope for current phase | `ai-change-scope.mdc` |
| Suppress a failing guard with `|| true` or similar | Hides real failures | Code review |
| Use parallel booleans for mutually exclusive states | Use discriminated unions instead | `state-management.mdc` |

---

## Repo Structure (agent-relevant paths only)

```
openspec/changes/<name>/specs/   Write new specs here (authoritative)
packages/contracts/              Generated contracts (never edit manually)
apps/web/app/(dashboard)/        Generated pages land here
scripts/                         All guard and generator commands
.cursor/rules/                   AI behavioral guardrails (read-only)
```

---

## Error Signal Reference

When a guard fails, stderr tells you exactly what is broken.

| Guard | Typical stderr | What to fix |
|---|---|---|
| `guard:specs` | `✗ openspec/.../foo.spec.md: missing section: ## examples` | Add the missing section to the spec file |
| `guard:specs` | `✗ ...: frontmatter missing required key: "version"` | Add `version: 1` to the frontmatter |
| `guard:specs` | `✗ ...: invalid JSON in ## input: ...` | Fix the JSON in the named section |
| `guard:contracts` | `✗ auth/login.contract.ts — valid example failed parse` | Update `## examples` → `valid*` to match the schema |
| `guard:contracts` | `✗ auth/login.contract.ts — invalid example passed (expected failure)` | Update `## examples` → `invalid*` to actually violate the schema |
| `guard:types` | TypeScript compiler output | Fix type errors in the reported file |
| `guard:ppr` | `✗ cacheComponents not found` | Restore `cacheComponents: true` in `next.config.ts` |

---

## Phase Boundaries

**Currently active: Phase 5.**

Do not implement content from Phase 6 or later without explicit approval.

| Phase | Scope |
|---|---|
| 0–5 | In scope |
| 6 | Page generator CLI — needs approval |
| 7 | Observability, audit MCP integration — needs approval |
| 8 | Deploy pipeline, release workflow — needs approval |
