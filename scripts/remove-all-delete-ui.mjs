#!/usr/bin/env node
/**
 * Remove all user-facing Delete UI from admin panel src.
 * Does not modify API functions — only removes buttons, menu items, dialogs, and visible labels.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '..', 'src')

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

function cleanImports(content) {
  // Remove Trash2 from lucide imports
  content = content.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]lucide-react['"]/g,
    (match, inner) => {
      const parts = inner
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p && p !== 'Trash2' && !p.startsWith('Trash2 '))
      if (!parts.length) return ''
      return `import { ${parts.join(', ')} } from 'lucide-react'`
    },
  )
  // Remove standalone ConfirmDeleteDialog imports
  content = content.replace(
    /^import\s+ConfirmDeleteDialog\s+from\s+['"][^'"]+['"];?\s*\n/gm,
    '',
  )
  content = content.replace(
    /^import\s+Confirm\w+DeleteModal\s+from\s+['"][^'"]+['"];?\s*\n/gm,
    '',
  )
  return content
}

function cleanContent(content) {
  let out = content

  // Menu / table action items with Delete label
  out = out.replace(/\{[^}]*label:\s*['"]Delete['"][^}]*\},?\s*/g, '')

  // ActionBtn blocks with Delete label
  out = out.replace(
    /<ActionBtn[\s\S]*?label=["']Delete["'][\s\S]*?<\/ActionBtn>\s*/g,
    '',
  )

  // Button blocks containing Trash2 (multiline)
  out = out.replace(/<button[\s\S]*?<Trash2[\s\S]*?<\/button>\s*/g, (block) => {
    if (/Delete|onDelete|delete/i.test(block)) return ''
    return block
  })

  // Icon-only delete buttons using Trash2 in other patterns
  out = out.replace(/<Trash2[^/]*\/>\s*/g, (m, offset, str) => {
    const start = Math.max(0, offset - 400)
    const ctx = str.slice(start, offset + 50)
    if (/Delete|onDelete|delete/i.test(ctx)) return ''
    return m
  })

  // ConfirmDeleteDialog JSX
  out = out.replace(/<ConfirmDeleteDialog[\s\S]*?\/>/g, '')
  out = out.replace(/<Confirm\w+DeleteModal[\s\S]*?\/>/g, '')

  // User-visible Delete strings in JSX text (careful replacements)
  out = out.replace(/>(\s*)Delete(\s*)</g, '>$1Deactivate$2<')
  out = out.replace(/title=["']Delete[^"']*["']/gi, 'title="Deactivate"')
  out = out.replace(/aria-label=\{[`'"]Delete /gi, (m) =>
    m.replace('Delete', 'Deactivate'),
  )
  out = out.replace(/aria-label=["']Delete /gi, 'aria-label="Deactivate ')

  // Bulk confirm type delete -> deactivate (no-op paths)
  out = out.replace(/type:\s*['"]delete['"]/g, "type: 'deactivate'")
  out = out.replace(/setBulkConfirm\(\{\s*type:\s*['"]delete['"]\s*\}\)/g, '')
  out = out.replace(/bulkConfirm\s*===\s*['"]delete['"]/g, "bulkConfirm === 'deactivate'")

  return out
}

function cleanRecurrence(content) {
  return content
    .replace(/RECURRENCE_DELETE_SCOPES/g, 'RECURRENCE_CANCEL_SCOPES')
    .replace(/Delete single occurrence/g, 'Cancel this occurrence')
    .replace(/Delete future occurrences/g, 'Cancel future occurrences')
    .replace(/Delete complete recurring schedule/g, 'Cancel entire recurring schedule')
}

function cleanRbac(content) {
  return content.replace(
    /\{\s*key:\s*['"]delete['"],\s*label:\s*['"]Delete['"]\s*\}/g,
    "{ key: 'delete', label: 'Deactivate' }",
  )
}

let changed = 0
for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content

  if (file.endsWith('recurrence.js')) {
    content = cleanRecurrence(content)
  }
  if (file.endsWith('rbacPermissionModel.js')) {
    content = cleanRbac(content)
  }

  content = cleanImports(content)
  content = cleanContent(content)

  // Drop empty lucide import lines
  content = content.replace(/import\s*\{\s*\}\s*from\s*['"]lucide-react['"];?\s*\n/g, '')

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8')
    changed++
  }
}

console.log(`Cleaned delete UI in ${changed} files.`)
