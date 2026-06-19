#!/usr/bin/env node
/** Remove delete menu items from TableActionMenu consumers and row actions with Trash2. */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '..', 'src')

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(jsx?)$/.test(entry.name)) files.push(full)
  }
  return files
}

let count = 0
for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content

  // Remove table action menu items with delete/danger
  content = content.replace(
    /\{[^}]*label:\s*['"]Delete['"][^}]*danger:\s*true[^}]*\},?\s*/g,
    '',
  )
  content = content.replace(
    /\{[^}]*danger:\s*true[^}]*label:\s*['"]Delete['"][^}]*\},?\s*/g,
    '',
  )

  // Remove IconActionBtn / ActionButton blocks with Delete label and Trash2
  content = content.replace(
    /<IconActionBtn[\s\S]*?label=["']Delete["'][\s\S]*?<\/IconActionBtn>\s*/g,
    '',
  )

  // Remove menu items label Delete with Trash2 icon blocks (multiline object in arrays)
  content = content.replace(
    /\{\s*label:\s*['"]Delete['"],[\s\S]*?onClick:[\s\S]*?\},?\s*/g,
    (m) => (m.includes('Trash2') || m.includes('delete') ? '' : m),
  )

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8')
    count++
  }
}

console.log(`Cleaned delete actions in ${count} files.`)
