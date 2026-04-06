---
domain: auth
action: login
version: 1.0.0
migrated_from: specs/auth-login.spec.md
migration_note: Migrated from legacy `specs/auth-login.spec.md` during Phase 5 OpenSpec integration.
---

Validates user credentials and returns a short-lived access token.
This spec is the source of truth for `packages/contracts/auth/login.contract.ts`.
Regenerate the contract with: `npm run gen:contracts`

## input

```json
[
  { "name": "email",    "zodType": "z.string().email()" },
  { "name": "password", "zodType": "z.string().min(8)" }
]
```

## success

```json
[
  { "name": "userId",      "zodType": "z.string().uuid()" },
  { "name": "accessToken", "zodType": "z.string().min(1)" }
]
```

## error

```json
[
  { "name": "code",    "zodType": "z.enum(['INVALID_CREDENTIALS', 'ACCOUNT_LOCKED', 'RATE_LIMITED'])" },
  { "name": "message", "zodType": "z.string().min(1)" }
]
```

## examples

```json
{
  "validInput":    { "email": "user@example.com",                         "password": "secret123" },
  "invalidInput":  { "email": "not-an-email",                             "password": "123" },
  "validSuccess":  { "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",   "accessToken": "tok_example" },
  "invalidSuccess": { "userId": "not-a-uuid" },
  "validError":   { "code": "INVALID_CREDENTIALS", "message": "Email or password is incorrect." },
  "invalidError": { "code": "UNKNOWN_CODE",         "message": "test" }
}
```
