#!/usr/bin/env node
/**
 * Quick check that integrated features exist in this checkout.
 * Run: node scripts/verify-features.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const checks = [
  ['CourseMarketingSections + EditableSectionBar', 'src/components/categories/CourseMarketingSections.jsx', 'EditableSectionBar'],
  ['Help Desk reply status action', 'src/components/help-desk/helpDeskTableCells.jsx', 'onToggleReplyStatus'],
  ['Header dashboard actions', 'src/components/layout/Header.jsx', 'handleHeaderAdd'],
  ['Classroom Go Back', 'src/components/courses/ModalPanelHeader.jsx', 'onBack ?? onClose'],
]

let failed = 0
for (const [label, file, needle] of checks) {
  if (!existsSync(file)) {
    console.error(`FAIL: ${label} — missing ${file}`)
    failed++
    continue
  }
  const text = readFileSync(file, 'utf8')
  if (!text.includes(needle)) {
    console.error(`FAIL: ${label} — ${file} does not contain "${needle}"`)
    failed++
  } else {
    console.log(`OK: ${label}`)
  }
}

try {
  const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
  console.log(`\nGit: ${branch} @ ${sha}`)
} catch {
  console.log('\n(Git info unavailable)')
}

process.exit(failed ? 1 : 0)
