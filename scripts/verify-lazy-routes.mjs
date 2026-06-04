#!/usr/bin/env node
/**
 * Ensures every dynamic import in lazy route files resolves to an existing module.
 * Run: node scripts/verify-lazy-routes.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sources = [
  'src/routes/lazyPages.js',
  'src/layouts/BookstoreLayout.jsx',
  'src/layouts/BatchManagementLayout.jsx',
  'src/layouts/LiveClassesLayout.jsx',
  'src/layouts/ContentLibraryLayout.jsx',
  'src/layouts/TestManagementLayout.jsx',
  'src/layouts/RewardsLayout.jsx',
  'src/layouts/StudentRewardsLayout.jsx',
]

function resolveImport(fromDir, spec) {
  const base = normalize(join(fromDir, spec))
  const candidates = [`${base}.jsx`, `${base}.js`, `${base}.tsx`, `${base}.ts`, join(base, 'index.jsx')]
  return candidates.find((p) => existsSync(p)) ?? null
}

let failed = 0
for (const rel of sources) {
  const file = join(root, rel)
  const fromDir = dirname(file)
  const text = readFileSync(file, 'utf8')
  const imports = [...text.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1])

  for (const spec of imports) {
    if (!resolveImport(fromDir, spec)) {
      console.error(`FAIL: ${rel} — missing target for "${spec}"`)
      failed++
    }
  }
  console.log(`OK: ${rel} (${imports.length} dynamic imports)`)
}

process.exit(failed ? 1 : 0)
