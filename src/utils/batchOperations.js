import { BATCH_STATUSES } from '../data/batchManagementData'

export const DEFAULT_BATCH_CAPACITY = 50

export const NON_TRANSFER_TARGET_STATUSES = ['Archived', 'Completed', 'Cancelled']

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
    ...BATCH_STATUSES.map((s) => ({ value: s, label: s })),
  ]
}
