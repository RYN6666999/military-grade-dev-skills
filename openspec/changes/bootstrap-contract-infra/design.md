# Design: bootstrap-contract-infra

## Architecture Decision: Template-Based Generation

The generator (`spec-to-contract.mjs`) uses a **template-based** approach:
spec authors write Zod expression strings directly in the spec file, and the
generator inserts them verbatim into a TypeScript template.

This was chosen over semantic parsing (GWT-style or NLP-inferred) because:
- The output is deterministic and auditable — no "magic" in the middle.
- Spec authors retain full control over the Zod expression (`.min(8)`,
  `.uuid()`, `z.enum([...])` etc.).
- The generator itself is ~115 lines with zero external dependencies.

## Spec Format

```
---
domain: <domain>
action: <action>
version: <semver>
---

## input    ← z.object fields for the request/input
## success  ← z.object fields for the success response
## error    ← z.object fields for the error response
## examples ← { validInput, invalidInput, validSuccess, invalidSuccess, validError, invalidError }
```

Each section contains a single fenced JSON block. Field arrays use
`{ "name": string, "zodType": string }` objects. The `examples` section
is a flat object with named keys (not an array DSL).

## Contract File Convention

Generated files follow the naming pattern:
```
packages/contracts/<domain>/<action>.contract.ts
```

Example: `packages/contracts/auth/login.contract.ts`

Each file exports:
- `<Action><Kind>Schema` — the Zod schema object
- `<Action><Kind>` — the inferred TypeScript type
- `<action>ContractExamples` — the examples object (consumed by verify script)

Files are prefixed with `// AUTO-GENERATED` and must not be hand-edited.

## Semantic Verification Strategy

`verify-contracts.mjs` dynamically imports each `*.contract.ts` and:

1. Confirms all `*Schema` exports are Zod objects (duck-type: have `.safeParse`).
2. Finds the `*ContractExamples` export.
3. For each schema, derives the "kind" (Input / Success / Error) from the
   export name and looks up `valid<Kind>` and `invalid<Kind>` in examples.
4. Asserts `valid<Kind>` parses successfully.
5. Asserts `invalid<Kind>` fails to parse.

This catches schema regressions that TypeScript cannot catch
(e.g., `z.string().min(8)` accidentally changed to `z.string().min(1)`).

## Dual-Track Spec Resolution (Phase 5 addition)

The generator resolves spec files in priority order:
1. `openspec/changes/*/specs/**/*.spec.md` — OpenSpec path (authoritative)
2. `specs/*.spec.md` — legacy path (deprecated, fallback only)

If both paths contain a spec for the same `domain/action`, the OpenSpec
path wins. Legacy specs should be migrated into a change directory and
marked `deprecated` in the file header.

## Package Structure

```
packages/contracts/
├── package.json         (zod: ^3.24.0, no other runtime deps)
├── tsconfig.json        (extends root strict config)
├── index.ts             (barrel: export * from './auth/login.contract')
└── auth/
    └── login.contract.ts  (AUTO-GENERATED)
```
