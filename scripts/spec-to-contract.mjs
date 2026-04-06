// scripts/spec-to-contract.mjs
// Reads *.spec.md files and generates *.contract.ts files under packages/contracts/{domain}/.
//
// Usage:
//   node scripts/spec-to-contract.mjs                   <- process all discovered specs
//   node scripts/spec-to-contract.mjs path/to/spec.md   <- one specific file
//
// Spec resolution order (dual-track, OpenSpec path takes priority):
//   1. openspec/changes/*/specs/**/*.spec.md  — authoritative (OpenSpec)
//   2. specs/*.spec.md                        — legacy path (deprecated fallback)
//
// If both tracks contain a spec for the same domain+action, the OpenSpec path wins.
// Legacy specs marked with `deprecated: true` in frontmatter are still processed
// as a fallback but will emit a warning.
//
// Spec format requirements:
//   - YAML frontmatter with: domain, action, version
//   - Four ## sections, each containing a ```json fenced block:
//       ## input, ## success, ## error  — array of { name, zodType }
//       ## examples                     — object with valid/invalid keys

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const OPENSPEC_CHANGES_DIR = join(ROOT, 'openspec', 'changes')
const LEGACY_SPECS_DIR = join(ROOT, 'specs')
const CONTRACTS_DIR = join(ROOT, 'packages', 'contracts')

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/** Extracts the YAML-like frontmatter block (simple key: value only). */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) throw new Error('Spec is missing frontmatter (expected --- block at top)')

  const meta = {}
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
  }

  const required = ['domain', 'action', 'version']
  for (const key of required) {
    if (!meta[key]) throw new Error(`Frontmatter missing required key: "${key}"`)
  }
  return meta
}

/** Extracts the first ```json block under a given ## heading. */
function parseSection(content, heading) {
  // Match: ## heading (optional trailing whitespace) then ```json ... ```
  const re = new RegExp(`##\\s+${heading}\\s+\`\`\`json([\\s\\S]*?)\`\`\``, 'i')
  const match = content.match(re)
  if (!match) throw new Error(`Spec is missing section: ## ${heading}`)
  try {
    return JSON.parse(match[1].trim())
  } catch (err) {
    throw new Error(`Failed to parse JSON in ## ${heading}: ${err.message}`)
  }
}

// ---------------------------------------------------------------------------
// Dual-track spec discovery
// ---------------------------------------------------------------------------

/**
 * Recursively finds all *.spec.md files under a directory.
 * Returns [] if the directory does not exist.
 */
async function findSpecFiles(dir) {
  let entries
  try {
    entries = await readdir(dir, { recursive: true })
  } catch {
    return []
  }
  return entries
    .filter((name) => name.endsWith('.spec.md'))
    .map((name) => join(dir, name))
}

/**
 * Builds a deduplicated list of spec files.
 *
 * Priority rules:
 *   1. Scan openspec/changes/* /specs/ — all found specs are authoritative.
 *   2. Scan legacy specs/ — only include if no OpenSpec spec covers the same
 *      domain+action (determined by parsing frontmatter).
 *   3. Deprecated legacy specs that are superseded emit a warning, not an error.
 */
async function discoverSpecFiles() {
  // --- OpenSpec specs (authoritative) ---
  let openspecFiles = []
  let openspecChangeDirs
  try {
    openspecChangeDirs = await readdir(OPENSPEC_CHANGES_DIR)
  } catch {
    openspecChangeDirs = []
  }

  for (const changeDir of openspecChangeDirs) {
    if (changeDir === 'archive') continue
    const specsDir = join(OPENSPEC_CHANGES_DIR, changeDir, 'specs')
    const found = await findSpecFiles(specsDir)
    openspecFiles = openspecFiles.concat(found)
  }

  // Build a set of domain+action keys already covered by OpenSpec
  const coveredKeys = new Set()
  for (const f of openspecFiles) {
    try {
      const content = await readFile(f, 'utf8')
      const meta = parseFrontmatter(content)
      coveredKeys.add(`${meta.domain}/${meta.action}`)
    } catch {
      // If we can't parse frontmatter, still include the file — it will fail loudly later
    }
  }

  // --- Legacy specs (fallback) ---
  const legacyFiles = await findSpecFiles(LEGACY_SPECS_DIR)
  const legacyIncluded = []

  for (const f of legacyFiles) {
    try {
      const content = await readFile(f, 'utf8')
      const meta = parseFrontmatter(content)
      const key = `${meta.domain}/${meta.action}`

      if (coveredKeys.has(key)) {
        // Superseded by OpenSpec — skip with warning
        const rel = f.replace(ROOT + '/', '')
        const isDeprecated = meta.deprecated === 'true'
        if (!isDeprecated) {
          console.warn(`⚠  ${rel}: superseded by OpenSpec spec for ${key} (consider adding deprecated: true)`)
        }
        continue
      }

      if (meta.deprecated === 'true') {
        const rel = f.replace(ROOT + '/', '')
        console.warn(`⚠  ${rel}: deprecated spec with no OpenSpec replacement — still generating`)
      }

      legacyIncluded.push(f)
      coveredKeys.add(key)
    } catch {
      legacyIncluded.push(f) // Include and let processSpec report the error
    }
  }

  return [...openspecFiles, ...legacyIncluded]
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

/** Capitalizes the first character of a string. */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Generates the full contract file content from parsed spec data.
 *
 * Naming convention:
 *   domain=auth, action=login  →  Login{Input|Success|Error}Schema
 *   examples export            →  loginContractExamples
 */
function generateContract({ meta, input, success, error, examples }) {
  const { domain, action, version } = meta
  const A = cap(action) // "Login"

  const schemaBlock = (fields, kind) => {
    const schemaName = `${A}${kind}Schema`
    const typeName = `${A}${kind}`
    const fieldLines = fields
      .map((f) => `  ${f.name}: ${f.zodType},`)
      .join('\n')
    return [
      `// ${typeName}`,
      `export const ${schemaName} = z.object({`,
      fieldLines,
      `})`,
      `export type ${typeName} = z.infer<typeof ${schemaName}>`,
    ].join('\n')
  }

  // Serialize examples as indented JSON, then append "as const"
  const examplesStr = JSON.stringify(examples, null, 2)

  return [
    `// AUTO-GENERATED — do not edit manually.`,
    `// Source:     ${domain}/${action}.spec.md  (v${version})`,
    `// Regenerate: npm run gen:contracts`,
    ``,
    `import { z } from 'zod'`,
    ``,
    schemaBlock(input, 'Input'),
    ``,
    schemaBlock(success, 'Success'),
    ``,
    schemaBlock(error, 'Error'),
    ``,
    `// Examples — consumed by scripts/verify-contracts.mjs (semantic smoke)`,
    `export const ${action}ContractExamples = ${examplesStr} as const`,
  ].join('\n') + '\n'
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function processSpec(specPath) {
  const content = await readFile(specPath, 'utf8')

  const meta = parseFrontmatter(content)
  const input = parseSection(content, 'input')
  const success = parseSection(content, 'success')
  const error = parseSection(content, 'error')
  const examples = parseSection(content, 'examples')

  // Validate field arrays
  for (const [section, fields] of [['input', input], ['success', success], ['error', error]]) {
    if (!Array.isArray(fields)) throw new Error(`## ${section} must be a JSON array`)
    for (const f of fields) {
      if (!f.name || !f.zodType) {
        throw new Error(`## ${section}: each field must have "name" and "zodType"`)
      }
    }
  }

  const contractContent = generateContract({ meta, input, success, error, examples })

  // Write to packages/contracts/{domain}/{action}.contract.ts
  const outDir = join(CONTRACTS_DIR, meta.domain)
  await mkdir(outDir, { recursive: true })
  const outPath = join(outDir, `${meta.action}.contract.ts`)
  await writeFile(outPath, contractContent, 'utf8')

  return { specPath, outPath }
}

async function main() {
  const args = process.argv.slice(2)

  let specFiles
  if (args.length > 0) {
    // Explicit file paths provided — skip discovery, process as-is
    specFiles = args.map((f) => resolve(f))
  } else {
    // Auto-discover: OpenSpec paths first, legacy specs as fallback
    specFiles = await discoverSpecFiles()
  }

  if (specFiles.length === 0) {
    console.log('No spec files found. Nothing to generate.')
    process.exit(0)
  }

  let ok = 0
  let fail = 0

  for (const specFile of specFiles) {
    try {
      const { outPath } = await processSpec(specFile)
      const rel = outPath.replace(ROOT + '/', '')
      console.log(`✓  generated  ${rel}`)
      ok++
    } catch (err) {
      console.error(`✗  ${specFile.replace(ROOT + '/', '')}: ${err.message}`)
      fail++
    }
  }

  console.log(`\n${ok} generated, ${fail} failed.`)
  if (fail > 0) process.exit(1)
}

main()
