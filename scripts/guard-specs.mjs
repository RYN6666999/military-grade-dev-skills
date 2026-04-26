// scripts/guard-specs.mjs
// Validates *.spec.md structure BEFORE generation.
// Catches format errors at the source, not downstream in gen:contracts.
//
// Run with:  node scripts/guard-specs.mjs
//
// For each discovered spec file this script checks:
//   1. YAML frontmatter block (---) exists and contains: domain, action, version
//   2. All four required ## sections are present: input, success, error, examples
//   3. Each section's ```json block parses without error
//
// This guard enforces "quality left" — spec format errors are caught the moment
// a spec is written, not when gen:contracts runs later in the pipeline.
//
// Exit code 0 = all specs valid. Exit code 1 = one or more invalid.

import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const OPENSPEC_CHANGES_DIR = join(ROOT, 'openspec', 'changes')

const REQUIRED_FRONTMATTER_KEYS = ['domain', 'action', 'version']
const REQUIRED_SECTIONS = ['input', 'success', 'error', 'examples']

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

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

async function discoverSpecFiles() {
  const files = []

  // OpenSpec paths (authoritative)
  let changeDirs = []
  try {
    changeDirs = await readdir(OPENSPEC_CHANGES_DIR)
  } catch {
    // No openspec/changes dir — not an error at this stage
  }
  for (const d of changeDirs) {
    if (d === 'archive') continue
    const found = await findSpecFiles(join(OPENSPEC_CHANGES_DIR, d, 'specs'))
    files.push(...found)
  }

  return files
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(content, filePath) {
  const errors = []

  // 1. Frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) {
    errors.push('missing frontmatter (expected --- block at top of file)')
    return errors // cannot continue without frontmatter
  }

  const fm = {}
  for (const line of fmMatch[1].split('\n')) {
    const colon = line.indexOf(':')
    if (colon !== -1) {
      fm[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
    }
  }

  for (const key of REQUIRED_FRONTMATTER_KEYS) {
    if (!fm[key]) errors.push(`frontmatter missing required key: "${key}"`)
  }

  // 2. Sections — each must exist and contain valid JSON
  for (const section of REQUIRED_SECTIONS) {
    const re = new RegExp(`##\\s+${section}\\s+\`\`\`json([\\s\\S]*?)\`\`\``, 'i')
    const match = content.match(re)
    if (!match) {
      errors.push(`missing section: ## ${section}`)
      continue
    }
    try {
      JSON.parse(match[1].trim())
    } catch (e) {
      errors.push(`invalid JSON in ## ${section}: ${e.message}`)
    }
  }

  return errors
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const specFiles = await discoverSpecFiles()

  if (specFiles.length === 0) {
    console.log('No spec files found. Nothing to validate.')
    process.exit(0)
  }

  let ok = 0
  let fail = 0

  for (const f of specFiles) {
    const rel = f.replace(ROOT + '/', '')
    let content
    try {
      content = await readFile(f, 'utf8')
    } catch (e) {
      console.error(`✗  ${rel}: cannot read file — ${e.message}`)
      fail++
      continue
    }

    const errors = validate(content, f)
    if (errors.length === 0) {
      console.log(`✓  ${rel}`)
      ok++
    } else {
      for (const e of errors) console.error(`✗  ${rel}: ${e}`)
      fail++
    }
  }

  console.log(`\n${ok} passed, ${fail} failed`)

  if (fail > 0) {
    console.error(
      '\nSpec format errors must be fixed before running gen:contracts.' +
      '\nSee openspec/project.md for spec format requirements.'
    )
    process.exit(1)
  }
}

main()
