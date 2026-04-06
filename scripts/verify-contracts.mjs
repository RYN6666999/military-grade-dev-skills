// scripts/verify-contracts.mjs
// Semantically verifies every *.contract.ts file under packages/contracts/.
//
// Run with:  tsx scripts/verify-contracts.mjs
// (tsx is required so dynamic import() can resolve .ts files)
//
// For each contract file this script checks:
//   1. All *Schema exports are Zod objects (duck-type: have .safeParse).
//   2. A *ContractExamples export exists with valid* and invalid* keys.
//   3. valid{Kind} examples parse successfully against {Action}{Kind}Schema.
//   4. invalid{Kind} examples fail to parse (safeParse returns success=false).
//
// Exit code 0 = all contracts pass. Exit code 1 = one or more failures.

import { readdir } from 'node:fs/promises'
import { join, resolve, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const CONTRACTS_DIR = join(ROOT, 'packages', 'contracts')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the "kind" suffix from a schema export name.
 *   "LoginInputSchema"   → "Input"
 *   "LoginSuccessSchema" → "Success"
 *   "LoginErrorSchema"   → "Error"
 *
 * Strategy: strip trailing "Schema", split on uppercase boundaries,
 * return the last segment.
 */
function extractKind(schemaName) {
  const withoutSchema = schemaName.replace(/Schema$/, '')
  const words = withoutSchema.split(/(?=[A-Z])/).filter(Boolean)
  return words[words.length - 1] ?? withoutSchema
}

// ---------------------------------------------------------------------------
// Verifier
// ---------------------------------------------------------------------------

async function verifyContract(contractPath) {
  const relPath = relative(ROOT, contractPath)
  const errors = []

  // Dynamic import — tsx handles .ts resolution
  let mod
  try {
    mod = await import(pathToFileURL(contractPath).href)
  } catch (err) {
    return [`[${relPath}] contract file import failed: ${err.message}`]
  }

  // Find all *Schema exports
  const schemaNames = Object.keys(mod).filter((k) => k.endsWith('Schema'))
  if (schemaNames.length === 0) {
    errors.push(`[${relPath}] no *Schema exports found`)
    return errors
  }

  // Find the *ContractExamples export (exactly one expected)
  const examplesKey = Object.keys(mod).find((k) => k.endsWith('ContractExamples'))
  if (!examplesKey) {
    errors.push(`[${relPath}] missing *ContractExamples export`)
    return errors
  }
  const examples = mod[examplesKey]

  // Verify each schema
  for (const schemaName of schemaNames) {
    const schema = mod[schemaName]

    // Duck-type check: must be a Zod schema
    if (typeof schema?.safeParse !== 'function') {
      errors.push(`[${relPath}] "${schemaName}" is not a Zod schema (missing safeParse)`)
      continue
    }

    const kind = extractKind(schemaName) // "Input" | "Success" | "Error"
    const validKey = `valid${kind}`      // "validInput"
    const invalidKey = `invalid${kind}`  // "invalidInput"

    // --- valid example must parse ---
    if (!(validKey in examples)) {
      errors.push(`[${relPath}] "${schemaName}": missing examples.${validKey}`)
    } else {
      const result = schema.safeParse(examples[validKey])
      if (!result.success) {
        const flat = JSON.stringify(result.error.flatten().fieldErrors)
        errors.push(`[${relPath}] "${schemaName}": valid example failed parse — ${flat}`)
      }
    }

    // --- invalid example must fail ---
    if (!(invalidKey in examples)) {
      errors.push(`[${relPath}] "${schemaName}": missing examples.${invalidKey}`)
    } else {
      const result = schema.safeParse(examples[invalidKey])
      if (result.success) {
        errors.push(`[${relPath}] "${schemaName}": invalid example unexpectedly passed`)
      }
    }
  }

  return errors
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Recursively find all *.contract.ts files
  let entries
  try {
    entries = await readdir(CONTRACTS_DIR, { recursive: true })
  } catch {
    console.error(`contracts directory not found: ${CONTRACTS_DIR}`)
    process.exit(1)
  }

  const contractFiles = entries
    .filter((name) => name.endsWith('.contract.ts'))
    .map((name) => join(CONTRACTS_DIR, name))

  if (contractFiles.length === 0) {
    console.error('No *.contract.ts files found under packages/contracts/')
    process.exit(1)
  }

  let pass = 0
  let fail = 0
  const allErrors = []

  for (const contractFile of contractFiles) {
    const errors = await verifyContract(contractFile)
    const relPath = relative(ROOT, contractFile)

    if (errors.length === 0) {
      console.log(`✓  ${relPath}`)
      pass++
    } else {
      for (const err of errors) console.error(`✗  ${err}`)
      fail++
      allErrors.push(...errors)
    }
  }

  console.log(`\n${pass} passed, ${fail} failed.`)

  if (fail > 0) {
    process.exit(1)
  }
}

main()
