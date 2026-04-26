# Guard Signals Reference

`npm run guard:all` runs five guards in sequence. Any failure stops the pipeline.
The guard name in the output tells you exactly which layer is broken.

## guard:specs (spec format validation)

Runs `node scripts/guard-specs.mjs`. Validates every `*.spec.md` before generation.

**Common failures and fixes:**

| stderr | What to fix |
|--------|-------------|
| `missing frontmatter` | Add `---` block at top of spec file |
| `frontmatter missing required key: "domain"` | Add `domain: <value>` to frontmatter |
| `frontmatter missing required key: "action"` | Add `action: <value>` to frontmatter |
| `frontmatter missing required key: "version"` | Add `version: "1"` to frontmatter |
| `missing section: ## input` | Add the missing `## input` section with a ```json block |
| `missing section: ## examples` | Add the missing `## examples` section with a ```json block |
| `invalid JSON in ## input` | Fix the JSON syntax inside the fenced block |

## guard:types (TypeScript strict)

Runs `turbo run typecheck` across all workspaces.

**Common failures and fixes:**

- `Type 'X' is not assignable to type 'Y'` → Check your import. You may be
  using a raw object where a Zod-inferred type is expected. Use `safeParse`
  and access `result.data`.
- `Property 'X' does not exist` → Missing field in your contract or wrong
  schema import.
- `'any' is not allowed` → Explicit `any` is forbidden. Use `unknown` and
  narrow with type guards or Zod parsing.
- `noUncheckedIndexedAccess` errors → Array or object access may be `undefined`.
  Add explicit bounds check.

## guard:lint (ESLint)

Runs `turbo run lint` across all workspaces.

**Common failures and fixes:**

- Import ordering → Let the linter auto-fix or reorder manually.
- Unused variables → Remove them or prefix with `_` if intentionally unused.

## guard:contracts (Zod semantic smoke)

Runs `tsx scripts/verify-contracts.mjs`. For each `*.contract.ts`:

1. All `*Schema` exports must be Zod objects (have `.safeParse`).
2. A `*ContractExamples` export must exist.
3. `valid{Kind}` examples must parse successfully.
4. `invalid{Kind}` examples must fail to parse.

**Common failures and fixes:**

| stderr | What to fix |
|--------|-------------|
| `valid example failed parse` | Spec's `## examples` → `valid*` data doesn't match schema fields/types |
| `invalid example unexpectedly passed` | Make the `invalid*` example actually violate the schema |
| `missing examples.validInput` | Examples object is missing a required key — check naming |
| `no *Schema exports found` | Re-run `npm run gen:contracts` |

After fixing spec examples, always re-run `gen:contracts` before `guard:contracts`.

## guard:ppr (cacheComponents check)

Runs `node scripts/check-ppr.mjs`. Checks that `cacheComponents: true`
exists in `apps/web/next.config.ts`.

**Failure fix:** Add `cacheComponents: true` back to the Next.js config.
Reference: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents
