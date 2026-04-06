// scripts/generate-page.mjs
// Generates a Next.js App Router page from a Handlebars template.
//
// Usage:
//   node scripts/generate-page.mjs <group> <name> <mode>
//   npm run gen:page <group> <name> <mode>
//
// Arguments:
//   group   Route group name (e.g. "dashboard" → "(dashboard)"), or "_root" for top-level
//   name    Page directory name (e.g. "analytics")
//   mode    Template mode: static | dynamic | ppr
//
// Overwrite policy: fails immediately if target file already exists.
// There is no --force flag.

import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Handlebars from 'handlebars'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const TEMPLATES_DIR = join(ROOT, 'templates')
const APP_DIR = join(ROOT, 'apps', 'web', 'app')

const VALID_MODES = ['static', 'dynamic', 'ppr']

function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function main() {
  const [, , group, name, mode] = process.argv

  // --- Validate args ---
  if (!group || !name || !mode) {
    console.error('Error: Missing arguments.')
    console.error('Usage: npm run gen:page <group> <name> <mode>')
    console.error('  group   Route group name, or "_root" for top-level')
    console.error('  name    Page directory name')
    console.error('  mode    static | dynamic | ppr')
    process.exit(1)
  }

  if (!VALID_MODES.includes(mode)) {
    console.error(
      `Error: Invalid mode "${mode}". Must be one of: ${VALID_MODES.join(', ')}`
    )
    process.exit(1)
  }

  // --- Compute output path ---
  const groupDir = group === '_root' ? '' : `(${group})`
  const outputDir = groupDir
    ? join(APP_DIR, groupDir, name)
    : join(APP_DIR, name)
  const outputFile = join(outputDir, 'page.tsx')

  // --- Fail if target exists ---
  if (await fileExists(outputFile)) {
    console.error(`Error: Target already exists: ${outputFile.replace(ROOT + '/', '')}`)
    console.error(
      'Overwrite is not supported. Remove the file manually if you intend to replace it.'
    )
    process.exit(1)
  }

  // --- Load and compile template ---
  const templatePath = join(TEMPLATES_DIR, `page-${mode}.hbs`)
  let templateSource
  try {
    templateSource = await readFile(templatePath, 'utf-8')
  } catch {
    console.error(`Error: Template not found: ${templatePath}`)
    process.exit(1)
  }

  const template = Handlebars.compile(templateSource)
  const routePath = groupDir ? `/${groupDir}/${name}` : `/${name}`
  const output = template({
    name,
    Name: toPascalCase(name),
    group,
    mode,
    routePath,
  })

  // --- Write output ---
  await mkdir(outputDir, { recursive: true })
  await writeFile(outputFile, output, 'utf-8')

  const relativePath = outputFile.replace(ROOT + '/', '')
  console.log(`✓ Generated: ${relativePath}`)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
