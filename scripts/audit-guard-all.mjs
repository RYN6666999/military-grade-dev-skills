// scripts/audit-guard-all.mjs
// Audited wrapper for `guard:all`.
//
// Usage:
//   npm run audit:guard:all
//
// Runs the full guard:all pipeline (guard:types, guard:lint, guard:contracts,
// guard:ppr) with inherited stdio, then writes a phase-7 audit event.
//
// Exit code policy:
//   - Original guard:all exit code is always preserved.
//   - If audit write fails, stderr message is printed and process exits non-zero.

import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeAuditEvent } from './write-audit-event.mjs'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')

const GUARD_STEPS = ['guard:types', 'guard:lint', 'guard:contracts', 'guard:ppr']
const COMMAND = 'npm run guard:all'

async function main() {
  const start = Date.now()

  const result = spawnSync('npm', ['run', 'guard:all'], {
    cwd: ROOT,
    stdio: 'inherit',
    // npm requires shell on all platforms when invoked via spawnSync without shell option
    shell: process.platform === 'win32',
  })

  const durationMs = Date.now() - start
  const exitCode = result.status ?? 1
  const status = exitCode === 0 ? 'success' : 'failed'

  try {
    await writeAuditEvent({
      phase: 'phase-7',
      eventType: 'run-guards',
      command: COMMAND,
      status,
      durationMs,
      inputs: GUARD_STEPS,
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
