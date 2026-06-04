export function nextExamSubCategoryId(list) {
  const max = list.reduce((m, row) => {
    const raw = row.subcategoryId || row.id || ''
    const num = parseInt(String(raw).replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `SUB${String(max + 1).padStart(3, '0')}`
}
