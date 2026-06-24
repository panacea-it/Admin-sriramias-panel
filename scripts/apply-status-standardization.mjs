#!/usr/bin/env node
/**
 * UI-only terminology standardization for record status actions.
 * Does not modify API identifiers, function names, or service calls.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '..', 'src')

const REPLACEMENTS = [
  ["label: 'Inactive'", "label: 'Deactivated'"],
  ['label: "Inactive"', 'label: "Deactivated"'],
  ["label: 'In Active'", "label: 'Deactivated'"],
  ['label: "In Active"', 'label: "Deactivated"'],
  ["label: 'Disabled'", "label: 'Deactivated'"],
  ['label: "Disabled"', 'label: "Deactivated"'],
  ["{ value: 'In Active', label: 'Inactive' }", "{ value: 'In Active', label: 'Deactivated' }"],
  ["{ value: 'Inactive', label: 'Inactive' }", "{ value: 'Inactive', label: 'Deactivated' }"],
  ["{ value: 'Disabled', label: 'Disabled' }", "{ value: 'Disabled', label: 'Deactivated' }"],
  ['Enable Selected', 'Activate Selected'],
  ['Disable Selected', 'Deactivate Selected'],
  ["title={isActive ? 'Disable' : 'Enable'}", "title={isActive ? 'Deactivate' : 'Activate'}"],
  ["ariaLabel={isActive ? `Disable ", "ariaLabel={isActive ? `Deactivate "],
  ["ariaLabel={isActive ? 'Disable ", "ariaLabel={isActive ? 'Deactivate "],
  ["'Enable faculty'", "'Activate'"],
  ["'Disable faculty'", "'Deactivate'"],
  ['Enable faculty', 'Activate'],
  ['Disable faculty', 'Deactivate'],
  ["enabling ? 'Enable faculty' : 'Disable faculty'", "enabling ? 'Activate' : 'Deactivate'"],
  ["enabling ? 'Enable' : 'Disable'", "enabling ? 'Activate' : 'Deactivate'"],
  ["isActive ? 'Disable' : 'Enable'", "isActive ? 'Deactivate' : 'Activate'"],
  ["'Inactive'", "'Deactivated'"],
  ['"Inactive"', '"Deactivated"'],
  ['Selected records enabled successfully.', 'Selected records activated successfully.'],
  ['Selected records disabled successfully.', 'Selected records deactivated successfully.'],
]

const SKIP_DIRS = new Set(['node_modules', 'dist'])

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) files.push(full)
  }
  return files
}

let filesChanged = 0
let totalReplacements = 0

for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  for (const [from, to] of REPLACEMENTS) {
    if (content.includes(from)) {
      const count = content.split(from).length - 1
      content = content.split(from).join(to)
      totalReplacements += count
    }
  }
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8')
    filesChanged++
  }
}

console.log(`Updated ${filesChanged} files with ${totalReplacements} replacements.`)
