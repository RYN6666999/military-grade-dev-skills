---
name: vibe-gen-page
description: >
  Generates a new Next.js page from a template. Use when asked to "create a page",
  "add a route", "scaffold a new page", or "generate a page component".
allowed-tools: Bash(npm run gen:page *) Read
---

# Vibe Gen Page — Page Scaffolding

## Arguments

You need two pieces of information from the user:

1. **name** — Page directory name in kebab-case (e.g., `analytics`, `user-profile`).
2. **type** — One of: `static`, `dynamic`, `ppr`.

If the user doesn't specify type, ask. Do not guess.

## Execution

```bash
npm run gen:page -- <name> <type>
```

Examples:
```bash
npm run gen:page -- analytics ppr
npm run gen:page -- about static
npm run gen:page -- dashboard dynamic
```

Generated file lands at: `apps/web/app/(dashboard)/<name>/page.tsx`

## Signals

**Success:** File created successfully.
**Failure — file exists:** Target already exists. Do not overwrite. Ask the user
whether to delete the existing file first.
**Failure — invalid type:** Must be `static`, `dynamic`, or `ppr`.
**Failure — missing args:** Both arguments are required.

## Template differences

| Type | Use when |
|------|----------|
| `static` | Page has no async data fetching; content is fully static |
| `dynamic` | Page fetches data per-request; uses `DynamicSection` |
| `ppr` | Page mixes static shell with streaming dynamic holes (Partial Pre-Rendering) |

## After Generation

The generated page is a skeleton. The user still needs to implement the
actual content. After implementation, run:

```bash
npm run guard:all
```
