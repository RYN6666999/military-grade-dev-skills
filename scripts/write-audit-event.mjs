// scripts/write-audit-event.mjs
// Core audit writer for Phase 7.
//
// Appends one audit event (as a single JSON line) to .ai-audit/events.jsonl.
// Called by audited wrapper scripts — not invoked directly.
//
// Schema (all fields required):
//   id          string  — crypto.randomUUID()
//   timestamp   string  — ISO 8601
//   phase       string  — e.g. "phase-7"
//   eventType   string  — fixed enum: generate-contracts | generate-page | run-guards
//   command     string  — full command string that was executed
//   status      string  — "success" | "failed"
//   durationMs  number  — wall-clock ms from start to finish
//   inputs      array   — string[] of CLI args or relevant inputs
//   outputs     array   — string[] of generated file paths or relevant outputs
//   specRefs    array   — string[] of spec files referenced (empty if not applicable)
//   notes       string  — free-form notes, may be empty string
//
// Overwrite policy: append-only. Existing events are never modified.
// If .ai-audit/ does not exist, it is created automatically.
// If write fails, the function throws — callers must not ignore the error.

import { appendFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const AUDIT_DIR = join(ROOT, '.ai-audit')
const AUDIT_FILE = join(AUDIT_DIR, 'events.jsonl')

const VALID_EVENT_TYPES = ['generate-contracts', 'generate-page', 'run-guards']
const VALID_STATUSES = ['success', 'failed']

/**
 * Write a single audit event to .ai-audit/events.jsonl.
 *
 * @param {object} params
 * @param {string} params.phase       - e.g. "phase-7"
 * @param {string} params.eventType   - fixed enum value
 * @param {string} params.command     - full command string
 * @param {'success'|'failed'} params.status
 * @param {number} params.durationMs  - wall-clock duration in ms
 * @param {string[]} params.inputs    - CLI args or relevant input identifiers
 * @param {string[]} params.outputs   - generated file paths or output identifiers
 * @param {string[]} params.specRefs  - spec files referenced (empty if none)
 * @param {string} params.notes       - free-form notes (empty string if none)
 */
export async function writeAuditEvent({
  phase,
  eventType,
  command,
  status,
  durationMs,
  inputs,
  outputs,
  specRefs,
  notes,
}) {
  if (!VALID_EVENT_TYPES.includes(eventType)) {
    throw new Error(
      `writeAuditEvent: invalid eventType "${eventType}". Must be one of: ${VALID_EVENT_TYPES.join(', ')}`
    )
  }
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(
      `writeAuditEvent: invalid status "${status}". Must be "success" or "failed".`
    )
  }

  const event = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    phase,
    eventType,
    command,
    status,
    durationMs,
    inputs: inputs ?? [],
    outputs: outputs ?? [],
    specRefs: specRefs ?? [],
    notes: notes ?? '',
  }

  await mkdir(AUDIT_DIR, { recursive: true })
  await appendFile(AUDIT_FILE, JSON.stringify(event) + '\n', 'utf-8')
}
