---
name: vibe-guard
description: >
  Runs the full guard pipeline and interprets results. Use when asked to
  "check the code", "run guards", "validate", "verify everything passes",
  or "is this ready to commit". Also use after any implementation is complete.
allowed-tools: Bash(npm run guard:*) Bash(npm run guard:all) Read
disable-model-invocation: true
---

# Vibe Guard — Quality Gate

Run the full guard pipeline and report results.

## Steps

### 1. Run all guards

```bash
npm run guard:all
```

This runs five checks in sequence:
1. `guard:specs` — spec file format validation
2. `guard:types` — TypeScript strict across all workspaces
3. `guard:lint` — ESLint baseline
4. `guard:contracts` — Zod semantic smoke tests
5. `guard:ppr` — Next.js cacheComponents check

### 2. Interpret results

**Exit code 0:** All guards passed. Report success.

**Exit code non-zero:** The pipeline stopped at the first failure.
Read stderr and identify which guard failed:

| Guard | Failure means | Fix |
|-------|--------------|-----|
| `guard:specs` | Spec has missing frontmatter, section, or invalid JSON | Fix the spec file |
| `guard:types` | TypeScript errors in source files | Fix type errors |
| `guard:lint` | ESLint violations | Fix lint issues |
| `guard:contracts` | Examples don't match generated schema | Fix spec examples, re-run `gen:contracts` |
| `guard:ppr` | `cacheComponents: true` missing from next.config.ts | Restore the config key |

### 3. Report

Summarize:
- Which guards passed
- Which guard failed (if any)
- What the error was
- What you did to fix it (if you fixed it)
