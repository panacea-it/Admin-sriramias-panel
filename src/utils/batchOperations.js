import { BATCH_STATUSES } from '../data/batchManagementData'

export const DEFAULT_BATCH_CAPACITY = 50

/** Only Active and Inactive are exposed in Batch Manager UI. */
export const BATCH_UI_STATUSES = BATCH_STATUSES

const INACTIVE_API_STATUSES = new Set([
  'INACTIVE',
  'IN_ACTIVE',
  'DISABLED',
  'ARCHIVED',
  'CANCELLED',
  'COMPLETED',
])

/** Map any backend/legacy status to Active or Inactive for display and forms. */
export function normalizeBatchUiStatus(status) {
  const upper = String(status || 'ACTIVE')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  if (INACTIVE_API_STATUSES.has(upper)) return 'Deactivated'
  return 'Active'
}

export const NON_TRANSFER_TARGET_STATUSES = ['Deactivated']

export function getBatchCapacity(row) {
  const fd = row?.formData || {}
  const cap = Number(row?.capacity ?? fd?.capacity)
  return Number.isFinite(cap) && cap > 0 ? cap : DEFAULT_BATCH_CAPACITY
}

export function getBatchStrength(studentCount) {
  return Math.max(0, Number(studentCount) || 0)
}

export function getAvailableSeats(capacity, strength) {
  return Math.max(0, capacity - strength)
}

export function isBatchNameTaken(name, batches, excludeId) {
  const normalized = String(name || '').trim().toLowerCase()
  if (!normalized) return false
  return batches.some((b) => {
    if (excludeId != null && String(b.id) === String(excludeId)) return false
    const label = (b.batchName || b.name || '').trim().toLowerCase()
    const display = `${b.linkedCourseName || b.courseName || ''} - ${label}`.toLowerCase()
    return label === normalized || display === normalized
  })
}

export function isBatchCodeTaken(code, batches, excludeId) {
  const normalized = String(code || '').trim().toLowerCase()
  if (!normalized) return false
  return batches.some((b) => {
    if (excludeId != null && String(b.id) === String(excludeId)) return false
    const existing = String(
      b.batchCode || b.formData?.batchCode || b.batchId || b.formData?.batchId || '',
    )
      .trim()
      .toLowerCase()
    return existing === normalized
  })
}

export function isBatchIdTaken(batchId, batches, excludeId) {
  const normalized = String(batchId || '').trim().toLowerCase()
  if (!normalized) return false
  return batches.some((b) => {
    if (excludeId != null && String(b.id) === String(excludeId)) return false
    const existing = String(b.batchId || b.formData?.batchId || '').trim().toLowerCase()
    return existing === normalized
  })
}

export function canTransferToBatch(targetRow, targetStrength) {
  const status = targetRow?.status || 'Active'
  if (NON_TRANSFER_TARGET_STATUSES.includes(status)) {
    return { ok: false, reason: `Cannot transfer to a ${status.toLowerCase()} batch.` }
  }
  const capacity = getBatchCapacity(targetRow)
  const available = getAvailableSeats(capacity, targetStrength)
  if (available <= 0) {
    return { ok: false, reason: 'Target batch has no available seats.' }
  }
  return { ok: true, capacity, strength: targetStrength, available }
}

export function extractFacultyOptions(apiRow) {
  const subjects = apiRow?.linkedSubjects || apiRow?.formData?.linkedSubjects || []
  const map = new Map()
  const trainer = apiRow?.formData?.trainerName || apiRow?.trainerName
  if (trainer) {
    map.set(trainer, { id: trainer, name: trainer })
  }
  for (const s of subjects) {
    if (s.facultyId && s.facultyName) {
      map.set(s.facultyId, { id: s.facultyId, name: s.facultyName })
    } else if (s.facultyName) {
      map.set(s.facultyName, { id: s.facultyName, name: s.facultyName })
    }
  }
  return Array.from(map.values())
}

export function batchStatusFilterOptions() {
  return [
    { value: 'all', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Deactivated', label: 'Deactivated' },
  ]
}
