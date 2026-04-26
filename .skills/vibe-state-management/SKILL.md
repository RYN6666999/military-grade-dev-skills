---
name: vibe-state-management
description: >
  Prevents useState sprawl. Mutually exclusive states must be modeled as
  discriminated unions, not parallel booleans. Use when writing or reviewing
  React components with state logic.
paths: apps/**/components/**/*.tsx, apps/**/app/**/*.tsx, packages/ui/**/*.tsx
---

# State Management — No Boolean Soup

## Intent

Implicit boolean combinations produce states that are impossible in the domain
but possible in code. Explicit state modeling eliminates impossible states at
the type level and makes transitions auditable.

## The 3-useState Rule

If a component has **3 or more `useState` calls that are logically related**,
it MUST be refactored to one of:

1. `useReducer` with typed actions — for local, self-contained state
2. A state machine in `@vibe/machines` (Phase 7+) — for complex lifecycle
3. A dedicated custom hook — if the logic can be cleanly encapsulated

"Logically related" means: changing one state value should cause you to
consider changing another.

## Mutually Exclusive States

These states are **always** mutually exclusive and MUST be modeled as a
discriminated union — never as parallel booleans:

```
idle | loading | success | error | empty | disabled
```

## Forbidden Behavior

- MUST NOT add a 4th related `useState` without consolidating into `useReducer`.
- MUST NOT use boolean flags for states that are mutually exclusive.
- MUST NOT leave derived state in `useState` — compute it from primary state.
- MUST NOT build state transitions with scattered `setX(true); setY(false)`
  sequences.

## Good Example

```ts
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

type FetchAction<T> =
  | { type: 'start' }
  | { type: 'success'; data: T }
  | { type: 'error'; message: string }

function fetchReducer<T>(
  state: FetchState<T>,
  action: FetchAction<T>
): FetchState<T> {
  switch (action.type) {
    case 'start':   return { status: 'loading' }
    case 'success': return { status: 'success', data: action.data }
    case 'error':   return { status: 'error', message: action.message }
    default:        return state
  }
}
```

## Bad Example

```ts
// FORBIDDEN: 3 related booleans, impossible states possible
const [loading, setLoading] = useState(false)
const [error, setError] = useState(false)
const [data, setData] = useState<User | null>(null)
```

## Notes

- Two completely independent `useState` calls (e.g. `isMenuOpen` and
  `inputValue`) do not count toward the limit.
- `useReducer` does not require XState. A plain reducer with typed actions
  is sufficient for most cases.
