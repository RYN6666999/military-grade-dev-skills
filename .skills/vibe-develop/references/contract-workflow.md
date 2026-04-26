# Contract Workflow

Complete reference for creating and updating Zod runtime contracts.

## When to Create a Contract

Any time your feature has an I/O boundary:
- New API route
- New Server Action
- New fetch call to an external service
- New form with server-side processing

## Full Lifecycle

```
1. Write spec       openspec/changes/<name>/specs/<domain>/<action>.spec.md
2. Validate spec    npm run guard:specs
3. Generate         npm run gen:contracts
4. Verify           npm run guard:contracts
5. Implement        import { LoginInputSchema } from '@vibe/contracts'
6. Full check       npm run guard:all
```

## Step-by-Step

### 1. Create the spec directory

```
openspec/changes/
  <feature-name>/
    specs/
      <domain>/
        <action>.spec.md
```

Example: `openspec/changes/user-profile/specs/user/update-profile.spec.md`

### 2. Write the spec

See `spec-format.md` in this directory for the full format.

Minimum valid spec:

```markdown
---
domain: user
action: update-profile
version: "1"
---

## input

\`\`\`json
[
  { "name": "displayName", "zodType": "z.string().min(1).max(100)" }
]
\`\`\`

## success

\`\`\`json
[
  { "name": "updatedAt", "zodType": "z.string().datetime()" }
]
\`\`\`

## error

\`\`\`json
[
  { "name": "code", "zodType": "z.enum(['VALIDATION_FAILED', 'NOT_FOUND'])" },
  { "name": "message", "zodType": "z.string()" }
]
\`\`\`

## examples

\`\`\`json
{
  "validInput": { "displayName": "Alice" },
  "invalidInput": { "displayName": "" },
  "validSuccess": { "updatedAt": "2025-01-01T00:00:00Z" },
  "invalidSuccess": { "updatedAt": "not-a-date" },
  "validError": { "code": "NOT_FOUND", "message": "User not found" },
  "invalidError": { "code": "BAD_CODE", "message": 123 }
}
\`\`\`
```

### 3. Validate and generate

```bash
npm run guard:specs      # must pass before gen:contracts
npm run gen:contracts    # produces packages/contracts/user/update-profile.contract.ts
npm run guard:contracts  # smoke-tests the generated schema
```

### 4. Implement

```ts
import {
  UpdateProfileInputSchema,
  type UpdateProfileInput,
  type UpdateProfileSuccess,
  type UpdateProfileError,
} from '@vibe/contracts'

// In a Server Action:
const result = UpdateProfileInputSchema.safeParse(formData)
if (!result.success) {
  return { error: result.error.flatten() }
}
// result.data is UpdateProfileInput — fully typed, runtime-validated
```

## Updating an Existing Contract

1. Edit the spec file (never edit `*.contract.ts` directly).
2. Increment `version` in frontmatter.
3. Re-run `guard:specs → gen:contracts → guard:contracts`.
4. Fix any downstream TypeScript errors that result from schema changes.

## Generated File Location

```
packages/contracts/
  <domain>/
    <action>.contract.ts    ← NEVER edit manually
```

Exported names follow a strict convention (see `spec-format.md`).
