// scripts/audit-gen-contracts.mjs
// Audited wrapper for `gen:contracts` (scripts/spec-to-contract.mjs).
//
// Usage:
//   npm run audit:gen:contracts
//
// Behaviour:
//   1. Runs the original gen:contracts script with inherited stdio.
//   2. Records a phase-7 audit event regardless of outcome (success or failed).
//   3. Exits with the original exit code — audit layer never swallows failures.
//   4. If the audit write itself fails, prints to stderr and exits non-zero.

import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeAuditEvent } from './write-audit-event.mjs'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')

async function main() {
  const command = 'node scripts/spec-to-contract.mjs'
  const start = Date.now()

  const result = spawnSync('node', ['scripts/spec-to-contract.mjs'], {
    cwd: ROOT,
    stdio: 'inherit',
  })

  const durationMs = Date.now() - start
  const exitCode = result.status ?? 1
  const status = exitCode === 0 ? 'success' : 'failed'

  try {
    await writeAuditEvent({
      phase: 'phase-7',
      eventType: 'generate-contracts',
      command,
      status,
      durationMs,
      inputs: [],
      outputs: [],
      specRefs: [],
      notes: exitCode !== 0 ? `exited with code ${exitCode}` : '',
    })
  } catch (auditErr) {
    console.error('[audit] Failed to write audit event:', auditErr.message)
    process.exit(1)
  }

  process.exit(exitCode)
}

main()
