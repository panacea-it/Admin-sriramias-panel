/** Normalize status labels for filters and comparisons */
export function normalizeCategoryStatus(status) {
  if (!status) return ''
  const s = String(status).trim()
  if (s === 'Inactive' || s === 'InActive') return 'In Active'
  return s
}

export function matchesCategoryStatus(rowStatus, filterStatus) {
  if (filterStatus === 'all') return true
  return normalizeCategoryStatus(rowStatus) === normalizeCategoryStatus(filterStatus)
}

/** UI display label for category/program status values (does not change stored values). */
export function formatCategoryStatusDisplayLabel(status) {
  if (status == null || status === '' || status === 'all' || status === 'Status') {
    return status ?? ''
  }

  const raw = String(status).trim().toUpperCase().replace(/[\s-]+/g, '_')
  if (raw === 'IN_ACTIVE' || raw === 'INACTIVE' || raw === 'DISABLED') return 'Inactive'
  if (raw === 'ACTIVE') return 'Active'
  return status
}

export function isCategoryStatusActive(status) {
  const raw = String(status || '').trim().toUpperCase().replace(/[\s-]+/g, '_')
  return raw === 'ACTIVE' || status === 'Active'
}
