#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '..', 'src')

const STATUS_MODAL_WRAPPER = (name, importPath) => `import ConfirmStatusChangeModal from '${importPath}'

export default function ${name}({
  open,
  enabling,
  loading,
  onCancel,
  onConfirm,
}) {
  return (
    <ConfirmStatusChangeModal
      open={open}
      activating={enabling}
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
`

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

function relativeImport(from, to) {
  let rel = path.relative(path.dirname(from), to).replace(/\\/g, '/')
  if (!rel.startsWith('.')) rel = `./${rel}`
  return rel.replace(/\.jsx?$/, '')
}

const statusModalPath = path.join(SRC, 'components', 'common', 'ConfirmStatusChangeModal.jsx')
let statusCount = 0
let bulkCount = 0

for (const file of walk(SRC)) {
  const base = path.basename(file)
  if (/Confirm.*StatusModal\.jsx$/i.test(base) && !file.includes('ConfirmStatusChangeModal')) {
    const name = base.replace('.jsx', '')
    const importPath = relativeImport(file, statusModalPath)
    fs.writeFileSync(file, STATUS_MODAL_WRAPPER(name, importPath), 'utf8')
    statusCount++
  }

  if (/BulkActionsBar\.jsx$/i.test(base) || base === 'CenterBulkActionsBar.jsx') {
    let content = fs.readFileSync(file, 'utf8')
    const original = content
    content = content.replace(/, Trash2/g, '')
    content = content.replace(/import \{([^}]*), Trash2([^}]*)\}/g, 'import {$1$2}')
    content = content.replace(/import \{ Trash2, /g, 'import { ')
    content = content.replace(
      /\s*<button[\s\S]*?Delete Selected[\s\S]*?<\/button>\s*/g,
      '\n',
    )
    content = content.replace(/onDelete,\n/g, 'onDelete: _onDelete,\n')
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8')
      bulkCount++
    }
  }
}

console.log(`Updated ${statusCount} status modals, ${bulkCount} bulk action bars.`)
