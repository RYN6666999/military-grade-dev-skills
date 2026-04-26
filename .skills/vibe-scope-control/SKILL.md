---
name: vibe-scope-control
description: >
  Prevents silent scope expansion in AI-generated code. Every change must be
  traceable to a stated task. Use this skill always — it governs all code
  modifications in this repo. Activated when the agent modifies files, writes
  code, refactors, or implements any feature.
---

# Scope Control — No Silent Expansion

## Intent

The AI that writes code is not the AI that reviews it.
Silent scope expansion — touching files or adding logic beyond what was requested —
is a primary source of undetected regressions in AI-assisted development.
Every change must be traceable to a stated task.

## Required Behavior

- MUST declare the intended change scope at the start of any multi-file modification:
  ```
  Scope: modifying [file A] and [file B] to implement [stated task].
  Files NOT touched: [file C], [file D].
  ```
- MUST produce a change summary at the end of every non-trivial session:
  - Files modified (with reason)
  - Files NOT modified that were considered
  - Any decision that deviates from the stated spec (with rationale)
- If an adjacent improvement is noticed during implementation, MUST surface it
  as a separate suggestion — never apply it silently.
- If a requested change requires touching more files than initially scoped,
  MUST pause and confirm before expanding.
- MUST NOT refactor code that was not part of the stated task, even if the
  refactor seems obviously beneficial.

## Forbidden Behavior

- MUST NOT rename variables, reformat code, or restructure logic in files
  that are incidental to the task.
- MUST NOT add new dependencies, install packages, or modify `package.json`
  unless explicitly requested.
- MUST NOT delete or comment out existing code outside the task scope, even
  if it appears unused.
- MUST NOT add comments, TODOs, or console.log statements to files outside
  the change scope.
- MUST NOT "improve" error messages, types, or styles in files that were
  opened only for reference.

## Good Example

```
User: "Add email validation to the login form."

AI: "Scope: modifying apps/web/app/(auth)/login/page.tsx only.
     Adding client-side email format check before form submission.
     Not touching: auth API route, session logic, or other form fields.

     [implements change]

     Change summary:
     - Modified: login/page.tsx — added isValidEmail() guard on submit
     - Noted (not applied): the password field could also benefit from
       strength validation. Flagging as a separate suggestion."
```

## Bad Example

```
User: "Add email validation to the login form."

AI: [modifies login/page.tsx, also refactors the auth API route,
     renames 3 variables for clarity, adds console.logs for debugging,
     updates tsconfig.json with a new path alias it found useful]
```

## Traceability Standard

Each AI session that produces code changes SHOULD result in one of:
1. A git commit with a clear message referencing the task
2. A change summary visible in the conversation

## Notes

- This rule applies to refactoring sessions too. "Refactor X" means only X,
  not everything nearby.
- If the user says "while you're in there, also fix Y", that is explicit
  scope expansion — allowed.
