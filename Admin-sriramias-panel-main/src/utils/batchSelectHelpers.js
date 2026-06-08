import { NON_TRANSFER_TARGET_STATUSES } from './batchOperations'

export function mapBatchToSelectOption(row) {
  if (!row?.id) return null
  const batchId = row.batchId || row.id
  const batchName = row.batchName || row.name || row.displayName || 'Untitled batch'
  const status = row.status || 'Active'
  return {
    id: String(row.id),
    batchId: String(batchId),
    batchName,
    courseName: row.linkedCourseName || row.courseName || '',
    status,
    selectable: !NON_TRANSFER_TARGET_STATUSES.includes(status),
  }
}

export function buildActiveBatchOptions(rows = []) {
  const seen = new Set()
  return rows
    .map(mapBatchToSelectOption)
    .filter((opt) => {
      if (!opt || seen.has(opt.id)) return false
      seen.add(opt.id)
      return true
    })
    .sort((a, b) => a.batchName.localeCompare(b.batchName))
}

export function formatBatchSelectLabel(option) {
  if (!option) return ''
  const id = option.batchId || option.id
  return `${option.batchName} (${id}) · ${option.status}`
}
