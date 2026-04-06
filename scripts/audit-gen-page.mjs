// scripts/audit-gen-page.mjs
// Audited wrapper for `gen:page` (scripts/generate-page.mjs).
//
// Usage:
//   npm run audit:gen:page -- <group> <name> <mode>
//
// Examples:
//   npm run audit:gen:page -- dashboard analytics ppr
//   npm run audit:gen:page -- _root about static
//
// All CLI arguments are passed through transparently to the original script.
// Behaviour is identical to `npm run gen:page` — the only addition is an
// audit event written to .ai-audit/events.jsonl.
//
// Exit code policy:
//   - Original script exit code is always preserved.
//   - If audit write fails, stderr message is printed and process exits non-zero.

import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeAuditEvent } from './write-audit-event.mjs'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')

async function main() {
  // process.argv: [node, script, ...forwarded args]
  const forwardedArgs = process.argv.slice(2)
  const command = `node scripts/generate-page.mjs ${forwardedArgs.join(' ')}`
  const start = Date.now()

  const result = spawnSync('node', ['scripts/generate-page.mjs', ...forwardedArgs], {
    cwd: ROOT,
    stdio: 'inherit',
  })

  const durationMs = Date.now() - start
  const exitCode = result.status ?? 1
  const status = exitCode === 0 ? 'success' : 'failed'

  // Best-effort output path inference for audit record.
  // If args are <group> <name> <mode>, compute the expected page path.
  const [group, name, mode] = forwardedArgs
  let outputs = []
  if (group && name) {
    const groupDir = group === '_root' ? '' : `(${group})`
    const outputPath = groupDir
      ? `apps/web/app/${groupDir}/${name}/page.tsx`
      : `apps/web/app/${name}/page.tsx`
    outputs = [outputPath]
  }

  try {
    await writeAuditEvent({
      phase: 'phase-7',
      eventType: 'generate-page',
      command,
      status,
      durationMs,
      inputs: forwardedArgs,
      outputs: exitCode === 0 ? outputs : [],
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
