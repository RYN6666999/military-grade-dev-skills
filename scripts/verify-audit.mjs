// scripts/verify-audit.mjs
// Minimal audit log verifier for Phase 7.
//
// Usage:
//   node scripts/verify-audit.mjs
//   npm run audit:verify
//
// Checks performed on each line of .ai-audit/events.jsonl:
//   1. Line is valid JSON.
//   2. All required fields are present.
//   3. Field types are correct (string, number, array, etc.).
//   4. `status` is a valid enum value: "success" | "failed".
//   5. `eventType` is a valid enum value.
//
// Exit 0 = all checks passed.
// Exit 1 = one or more checks failed (details printed to stdout).
//
// If events.jsonl does not exist, the verifier exits 0 with a notice —
// an empty audit log is valid (no events have been recorded yet).

import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const AUDIT_FILE = join(ROOT, '.ai-audit', 'events.jsonl')

const REQUIRED_FIELDS = [
  'id',
  'timestamp',
  'phase',
  'eventType',
  'command',
  'status',
  'durationMs',
  'inputs',
  'outputs',
  'specRefs',
  'notes',
]

const VALID_EVENT_TYPES = ['generate-contracts', 'generate-page', 'run-guards']
const VALID_STATUSES = ['success', 'failed']

function checkEvent(event, lineNumber) {
  const errors = []

  // Required fields presence
  for (const field of REQUIRED_FIELDS) {
    if (!(field in event)) {
      errors.push(`missing required field: "${field}"`)
    }
  }

  if (errors.length > 0) return errors

  // Type checks
  if (typeof event.id !== 'string' || event.id.trim() === '') {
    errors.push('"id" must be a non-empty string')
  }
  if (typeof event.timestamp !== 'string' || isNaN(Date.parse(event.timestamp))) {
    errors.push('"timestamp" must be a valid ISO 8601 string')
  }
  if (typeof event.phase !== 'string' || event.phase.trim() === '') {
    errors.push('"phase" must be a non-empty string')
  }
  if (!VALID_EVENT_TYPES.includes(event.eventType)) {
    errors.push(
      `"eventType" must be one of: ${VALID_EVENT_TYPES.join(', ')} — got "${event.eventType}"`
    )
  }
  if (typeof event.command !== 'string' || event.command.trim() === '') {
    errors.push('"command" must be a non-empty string')
  }
  if (!VALID_STATUSES.includes(event.status)) {
    errors.push(`"status" must be "success" or "failed" — got "${event.status}"`)
  }
  if (typeof event.durationMs !== 'number' || event.durationMs < 0) {
    errors.push('"durationMs" must be a non-negative number')
  }
  if (!Array.isArray(event.inputs)) {
    errors.push('"inputs" must be an array')
  }
  if (!Array.isArray(event.outputs)) {
    errors.push('"outputs" must be an array')
  }
  if (!Array.isArray(event.specRefs)) {
    errors.push('"specRefs" must be an array')
  }
  if (typeof event.notes !== 'string') {
    errors.push('"notes" must be a string')
  }

  return errors
}

async function main() {
  let raw
  try {
    raw = await readFile(AUDIT_FILE, 'utf-8')
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('✓  audit:verify — events.jsonl not found; no events to verify.')
      process.exit(0)
    }
    console.error(`✗  audit:verify — could not read ${AUDIT_FILE}: ${err.message}`)
    process.exit(1)
  }

  const lines = raw.split('\n').filter((l) => l.trim() !== '')

  if (lines.length === 0) {
    console.log('✓  audit:verify — events.jsonl is empty; no events to verify.')
    process.exit(0)
  }

  let failed = 0

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1
    let event

    try {
      event = JSON.parse(lines[i])
    } catch {
      console.error(`✗  Line ${lineNumber}: invalid JSON`)
      failed++
      continue
    }

    const errors = checkEvent(event, lineNumber)
    if (errors.length > 0) {
      for (const err of errors) {
        console.error(`✗  Line ${lineNumber} (id: ${event.id ?? '?'}): ${err}`)
      }
      failed++
    }
  }

  if (failed > 0) {
    console.error(`\n✗  audit:verify — ${failed} of ${lines.length} events failed validation.`)
    process.exit(1)
  }

  console.log(`✓  audit:verify — ${lines.length} event(s) valid.`)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
