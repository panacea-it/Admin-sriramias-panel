#!/usr/bin/env node
/** Stub delete confirmation modals — delete removed from UI globally. */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '..', 'src')

const STUB = `/** Delete removed from UI — soft-control only (activate/deactivate). */
export default function DeleteModalStub() {
  return null
}
`

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/Delete/i.test(entry.name) && /\.(jsx?)$/.test(entry.name)) files.push(full)
  }
  return files
}

const skip = new Set([
  path.normalize(path.join(SRC, 'components', 'subjects', 'ConfirmDeleteDialog.jsx')),
])

let count = 0
for (const file of walk(SRC)) {
  if (skip.has(path.normalize(file))) continue
  const base = path.basename(file, path.extname(file))
  fs.writeFileSync(
    file,
    STUB.replace('DeleteModalStub', base),
    'utf8',
  )
  count++
}
console.log(`Stubbed ${count} delete modal files.`)
