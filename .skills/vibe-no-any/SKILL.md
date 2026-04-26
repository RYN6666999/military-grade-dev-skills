---
name: vibe-no-any
description: >
  Forbids the use of `any` in all TypeScript code. Use unknown, generics, or
  discriminated unions instead. Activated always — applies to every TypeScript
  file in this repo.
---

# No Any — Type Safety Is Non-Negotiable

## Intent

`any` erases the type system at the point of use and propagates unsafety
downstream. A single `any` can silently corrupt the type correctness of an
entire call chain.

## Forbidden Behavior

- MUST NOT write `any` in new code under any circumstances.
- MUST NOT use `as any` casts as a workaround for type errors.
- MUST NOT use `// @ts-ignore` without an accompanying explanation and a
  TODO tracking the fix.
- MUST NOT use `// @ts-expect-error` as a permanent solution — only acceptable
  for known library type gaps with a linked issue.
- MUST NOT accept or return `any` in function signatures.

## Required Alternatives

| Situation | Use Instead |
|-----------|-------------|
| Shape truly unknown at compile time | `unknown` — force callers to narrow |
| Function works on multiple types | Generic `<T>` with constraints |
| Union of known variants | Discriminated union `type X = A \| B \| C` |
| External API response | Zod schema + inferred type / `unknown` + narrowing |
| Rapid prototyping | `interface TodoType { /* TODO: define */ }` |
| Broken third-party types | `// @ts-expect-error [reason] — tracked: [ref]` |

## Workaround Format

When a workaround is unavoidable:

```ts
// TODO(no-any): replace with proper type when [library]@X.X ships correct types
// Tracked: [link or internal ref]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const result = thirdPartyFn() as unknown as ExpectedShape
```

## Good Example

```ts
async function fetchUser(id: string): Promise<User> {
  const raw: unknown = await fetch(`/api/users/${id}`).then(r => r.json())
  if (!isUser(raw)) throw new Error('Unexpected user shape')
  return raw
}

function first<T>(arr: readonly T[]): T | undefined {
  return arr[0]
}
```

## Bad Example

```ts
// FORBIDDEN
async function fetchUser(id: string): Promise<any> {
  return fetch(`/api/users/${id}`).then(r => r.json())
}
```

## Notes

- `Record<string, unknown>` is correct for "object with unknown values",
  not `Record<string, any>`.
- `JSON.parse` returns `any` — always assign to `unknown` and validate.
