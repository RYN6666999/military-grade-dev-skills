---
name: vibe-spec-first
description: >
  Requires a spec or task description before writing any non-trivial code.
  A missing spec is a blocker, not a green light. Activated always — applies
  to every implementation task in this repo. Use when the agent is about to
  write new files, new routes, new components, or modify business logic.
---

# Spec First — No Spec, No Code

## Intent

Prevent AI from implementing code against a vague or missing requirement.
A missing spec is not a green light — it is a blocker.

## Required Behavior

- MUST confirm the requirement is clear before writing new files, new routes,
  new components, or modifying business logic.
- For any change touching > 1 file or > 10 lines: produce a one-paragraph
  task summary stating (1) what is being built, (2) what inputs/outputs are
  expected, (3) what error/edge cases exist. Then wait for confirmation.
- For small changes (≤ 1 file, ≤ 10 lines): a single-sentence change
  description is sufficient. No waiting required.
- If the requirement is ambiguous, surface 2–3 specific questions before
  writing any code. Do not guess.
- If a requirement partially exists (comment, TODO), restate it explicitly
  before proceeding.

## Forbidden Behavior

- MUST NOT begin implementation if the task is described only as a vague
  noun ("add auth", "build dashboard", "improve performance").
- MUST NOT expand scope beyond what the spec describes.
- MUST NOT treat "sounds good" or "go ahead" as a complete spec if the
  requirement is still unclear.

## Good Example

```
User: "Add a user avatar to the navbar."

AI: "Confirming scope before proceeding:
  1. Display-only — no upload or crop UI.
  2. Falls back to user initials if image URL is absent.
  3. Uses data already available in the existing auth session object.
  Proceeding on this basis."
```

## Bad Example

```
User: "Add a user avatar."

AI: [immediately creates Avatar.tsx, upload API route, S3 presigned URL
     helper, image crop modal, Cloudinary integration, avatar delete endpoint]
```

## Notes

- A spec does not need to be formal. A bullet list, a Figma link, or a clear
  sentence is enough.
- In iterative sessions, a running task summary in the conversation substitutes
  for a written spec.
- For contract-based changes, a `.spec.md` file in `openspec/changes/` is the
  canonical spec format. Use it for anything touching an I/O boundary.
