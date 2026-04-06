// scripts/verify-env.mjs
// Reads .env.example and checks whether all "required" keys are defined.
//
// Usage:
//   node scripts/verify-env.mjs
//   npm run verify:env
//
// A key is considered "required" when the comment line immediately above it
// contains the word "required" (e.g. "# required — description").
// All other keys are "optional".
//
// Check order:
//   1. Read .env (if it exists) and parse its KEY=value pairs.
//   2. Also check process.env.
//   A key is considered defined if it appears in either source with a non-empty value.
//
// Exit 0 = all required keys are present (or there are no required keys).
// Exit 1 = one or more required keys are missing.
// Exit 0 = .env.example does not exist (warning only).

import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const EXAMPLE_FILE = join(ROOT, '.env.example')
const ENV_FILE = join(ROOT, '.env')

/**
 * Parse a .env-format file into a Map of key → value.
 * Ignores blank lines and comment lines.
 */
function parseEnvFile(contents) {
  const map = new Map()
  for (const line of contents.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (key) map.set(key, value)
  }
  return map
}

/**
 * Parse .env.example lines into an array of { key, required } entries.
 * A key is required when the immediately preceding non-blank line is a
 * comment that contains the word "required".
 */
function parseExampleEntries(contents) {
  const lines = contents.split('\n')
  const entries = []
  let lastCommentLine = ''

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      // blank line resets the comment context
      lastCommentLine = ''
      continue
    }

    if (trimmed.startsWith('#')) {
      lastCommentLine = trimmed
      continue
    }

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) {
      lastCommentLine = ''
      continue
    }

    const key = trimmed.slice(0, eqIndex).trim()
    if (!key) {
      lastCommentLine = ''
      continue
    }

    const required = lastCommentLine.toLowerCase().includes('required')
    entries.push({ key, required })
    lastCommentLine = ''
  }

  return entries
}

async function main() {
  // Load .env.example
  let exampleContents
  try {
    exampleContents = await readFile(EXAMPLE_FILE, 'utf-8')
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn('verify:env — .env.example not found; nothing to check.')
      process.exit(0)
    }
    console.error(`verify:env — could not read .env.example: ${err.message}`)
    process.exit(1)
  }

  // Load .env (optional)
  let dotEnvMap = new Map()
  try {
    const dotEnvContents = await readFile(ENV_FILE, 'utf-8')
    dotEnvMap = parseEnvFile(dotEnvContents)
  } catch {
    // .env not present — rely on process.env only
  }

  const entries = parseExampleEntries(exampleContents)

  if (entries.length === 0) {
    console.log('verify:env — .env.example has no key entries; nothing to check.')
    process.exit(0)
  }

  const missing = []

  for (const { key, required } of entries) {
    const inDotEnv = dotEnvMap.has(key) && dotEnvMap.get(key) !== ''
    const inProcessEnv = key in process.env && process.env[key] !== ''
    const defined = inDotEnv || inProcessEnv
    const tag = required ? 'required' : 'optional'
    const statusMark = defined ? '✓' : (required ? '✗' : '-')
    console.log(`  ${statusMark}  ${key}  [${tag}]${defined ? '' : '  (not defined)'}`)
    if (required && !defined) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    console.error(`\nverify:env — ${missing.length} required key(s) missing: ${missing.join(', ')}`)
    process.exit(1)
  }

  console.log('\nverify:env — all required keys present.')
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
