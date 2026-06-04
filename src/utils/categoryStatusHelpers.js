/** Normalize status labels for filters and comparisons */
export function normalizeCategoryStatus(status) { if (!status) return '' const s = String(status).trim() if (s === 'Inactive' || s === 'InActive') return 'In Active' return s
} export function matchesCategoryStatus(rowStatus, filterStatus) { if (filterStatus === 'all') return true return normalizeCategoryStatus(rowStatus) === normalizeCategoryStatus(filterStatus)
}
