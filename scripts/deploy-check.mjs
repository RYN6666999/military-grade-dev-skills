// scripts/deploy-check.mjs
// Full deploy readiness check for Phase 8.
//
// Usage:
//   node scripts/deploy-check.mjs
//   npm run deploy:check
//
// Steps (executed in order, any failure stops immediately):
//   1. npm run guard:all   — type check, lint, contracts, ppr
//   2. npm run build       — production build
//   3. npm run verify:env  — required env var check
//
// Exit 0 = all steps passed.
// Exit 1 = any step failed (the failing step is reported).
//
// stdio is inherited so all sub-process output is displayed inline.

import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')

const STEPS = [
  { label: 'guard:all',  command: 'npm run guard:all'  },
  { label: 'build',      command: 'npm run build'      },
  { label: 'verify:env', command: 'npm run verify:env' },
]

function run(step) {
  console.log(`\n[deploy-check] Running ${step.label}...`)
  try {
    execSync(step.command, { cwd: ROOT, stdio: 'inherit' })
  } catch {
    console.error(`\n[deploy-check] FAILED at step: ${step.label}`)
    process.exit(1)
  }
}

for (const step of STEPS) {
  run(step)
}

console.log('\n[deploy-check] All checks passed. Ready to deploy.')
