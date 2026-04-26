# Spec File Format

Spec files are Markdown files with YAML frontmatter and four required sections.
They are validated by `guard:specs` before any generation occurs.

## Location

- Authoritative: `openspec/changes/<feature-name>/specs/<domain>/<action>.spec.md`
- Legacy (deprecated): `specs/<action>.spec.md` — do not create new files here

## Frontmatter (required)

```yaml
---
domain: auth
action: login
version: "1"
---
```

All three fields are required. `domain` determines the output subdirectory
under `packages/contracts/`. `action` determines the filename and schema
naming (e.g., `login` → `LoginInputSchema`, `LoginSuccessSchema`, `LoginErrorSchema`).

## Required Sections

Each section must contain exactly one fenced ```json block.
The `##` heading match is case-insensitive.

### ## input

Array of field objects. Each must have `name` (string) and `zodType` (string).

```json
[
  { "name": "email", "zodType": "z.string().email()" },
  { "name": "password", "zodType": "z.string().min(8)" }
]
```

### ## success

Same format as input.

```json
[
  { "name": "token", "zodType": "z.string()" },
  { "name": "expiresAt", "zodType": "z.string().datetime()" }
]
```

### ## error

Same format as input.

```json
[
  { "name": "code", "zodType": "z.enum(['INVALID_CREDENTIALS', 'ACCOUNT_LOCKED'])" },
  { "name": "message", "zodType": "z.string()" }
]
```

### ## examples

Object with `valid` and `invalid` keys for each kind (Input, Success, Error).

```json
{
  "validInput": { "email": "user@example.com", "password": "securepass123" },
  "invalidInput": { "email": "not-an-email", "password": "" },
  "validSuccess": { "token": "eyJ...", "expiresAt": "2025-01-01T00:00:00Z" },
  "invalidSuccess": { "token": 123, "expiresAt": "not-a-date" },
  "validError": { "code": "INVALID_CREDENTIALS", "message": "Wrong password" },
  "invalidError": { "code": "UNKNOWN_CODE", "message": 999 }
}
```

## Naming Convention

The `action` field drives all generated names:

| action | Schema name | Type name |
|--------|------------|-----------|
| login  | `LoginInputSchema` | `LoginInput` |
| login  | `LoginSuccessSchema` | `LoginSuccess` |
| login  | `LoginErrorSchema` | `LoginError` |
| login  | `loginContractExamples` | — |

Action is always lowercase in frontmatter. Generated names are PascalCase.
The examples export uses camelCase: `{action}ContractExamples`.

Do not deviate from this convention. `verify-contracts.mjs` relies on it to
locate examples by name. Non-standard naming causes silent test misses.
