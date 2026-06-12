export function matchesExamCategorySearch(row, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true

  const categoryId = String(row.categoryId || row.id || '').toLowerCase()
  const name = String(row.name || '').toLowerCase()

  return categoryId.includes(q) || name.includes(q)
}

export function nextExamCategoryId(list) {
  const max = list.reduce((m, row) => {
    const raw = row.categoryId || row.id || ''
    const num = parseInt(String(raw).replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `CAT${String(max + 1).padStart(3, '0')}`
}
