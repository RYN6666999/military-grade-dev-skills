# Tasks: bootstrap-contract-infra

All tasks below are complete. This change was implemented as Phase 3 of the
Vibe Coding Template build sequence and is now being recorded in OpenSpec
as part of Phase 5 integration.

## Completed Tasks

- [x] Initialize `packages/contracts/` with `package.json` (zod dep), `tsconfig.json`, `index.ts`
- [x] Define spec format: frontmatter (`domain`, `action`, `version`) + four `## section` JSON blocks
- [x] Write `scripts/spec-to-contract.mjs` — template-based generator, zero external deps
- [x] Write `scripts/verify-contracts.mjs` — semantic smoke runner (tsx, dynamic import)
- [x] Create first spec: `specs/auth-login.spec.md` (LoginInput / LoginSuccess / LoginError)
- [x] Run `gen:contracts` → generates `packages/contracts/auth/login.contract.ts`
- [x] Run `guard:contracts` → `1 passed, 0 failed`
- [x] Add `gen:contracts` and `guard:contracts` to root `package.json`
- [x] **Phase 5**: Migrate spec into `openspec/changes/bootstrap-contract-infra/specs/auth/login.spec.md`
- [x] **Phase 5**: Update `spec-to-contract.mjs` for dual-track path scanning (OpenSpec priority)
- [x] **Phase 5**: Update `packages/contracts/index.ts` barrel if path changes
- [x] **Phase 5**: Mark `specs/auth-login.spec.md` as deprecated migration source

## Guard Status

```
npm run guard:contracts  →  1 passed, 0 failed  ✓
npm run guard:all        →  all guards pass      ✓
```
