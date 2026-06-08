/**
 * Removes Tailwind `dark:*` utility classes from source files (class strings only).
 * Run: node scripts/strip-dark-tailwind.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..', 'src')
const EXT = new Set(['.jsx', '.js', '.tsx', '.ts'])

/** Only strip inside quoted className strings to avoid touching imports/comments. */
const QUOTED = /(['"`])([^'"`]*?)\1/g
const DARK_TOKEN = /\s*dark:[^\s'"`]+/g

function stripQuotedClasses(content) {
  return content.replace(QUOTED, (match, quote, inner) => {
    if (!inner.includes('dark:')) return match
    const cleaned = inner.replace(DARK_TOKEN, '').replace(/\s{2,}/g, ' ').trim()
    return `${quote}${cleaned}${quote}`
  })
}

function stripFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8')
  if (!original.includes('dark:')) return false
  const next = stripQuotedClasses(original)
  if (next === original) return false
  fs.writeFileSync(filePath, next, 'utf8')
  return true
}

function walk(dir, changed) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      walk(full, changed)
      continue
    }
    if (!EXT.has(path.extname(name))) continue
    if (stripFile(full)) changed.push(path.relative(ROOT, full))
  }
}

const changed = []
walk(ROOT, changed)
console.log(`Stripped dark: classes from ${changed.length} file(s).`)
changed.forEach((f) => console.log(`  - ${f}`))
