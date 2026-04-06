// scripts/check-ppr.mjs
// Verifies that cacheComponents: true is present in apps/web/next.config.ts.
//
// Purpose: prevent accidental removal of the cacheComponents flag.
// This is a deliberate guard — not a deep static analysis of route segments.
//
// Exit 0 = config found. Exit 1 = missing or disabled.

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..')
const CONFIG_PATH = resolve(ROOT, 'apps', 'web', 'next.config.ts')

async function main() {
  let source
  try {
    source = await readFile(CONFIG_PATH, 'utf8')
  } catch {
    console.error(`✗  guard:ppr — config file not found: ${CONFIG_PATH}`)
    process.exit(1)
  }

  // Match: cacheComponents: true (allows optional whitespace around the colon)
  const found = /cacheComponents\s*:\s*true/.test(source)

  if (!found) {
    console.error(`✗  guard:ppr — "cacheComponents: true" missing in ${CONFIG_PATH}`)
    console.error(`   Add it back: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents`)
    process.exit(1)
  }

  console.log(`✓  guard:ppr — cacheComponents: true found in next.config.ts`)
}

main()
