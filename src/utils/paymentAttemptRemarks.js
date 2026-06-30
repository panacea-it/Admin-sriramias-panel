/** TEMPORARY frontend-only counselor remark helpers — replace storage with API later. */

export const SUBJECT_PREVIEW_MAX_LENGTH = 25
export const REMARK_PREVIEW_MAX_LENGTH = 45

export function truncateRemarkPreview(text, maxLength = REMARK_PREVIEW_MAX_LENGTH) {
  if (!text) return '—'
  const trimmed = String(text).trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trimEnd()}...`
}

/**
 * @param {object} params
 * @param {object} params.attemptRow Payment attempt log row
 * @param {string} params.subject
 * @param {string} params.failureAnalysis
 * @param {string} params.remark
 */
export function buildCounselorRemarkRecord({ attemptRow, subject, failureAnalysis, remark }) {
  const attemptId = attemptRow.attemptId || attemptRow.id
  return {
    id: `remark-${attemptRow.id}`,
    attemptId,
    attemptRowId: attemptRow.id,
    student: attemptRow.student,
    center: attemptRow.center || attemptRow.centerName?.replace(' Center', '') || '—',
    centerName: attemptRow.centerName || `${attemptRow.center || 'Delhi'} Center`,
    counselor: attemptRow.counselorName || '—',
    subject: subject.trim(),
    failureAnalysis: failureAnalysis.trim(),
    remark: remark.trim(),
    createdAt: new Date().toISOString(),
  }
}

export function getRemarkForAttempt(remarks = [], attemptRowId) {
  return remarks.find((r) => r.attemptRowId === attemptRowId) ?? null
}

export function upsertCounselorRemark(remarks = [], nextRemark) {
  const withoutExisting = remarks.filter((r) => r.attemptRowId !== nextRemark.attemptRowId)
  return [nextRemark, ...withoutExisting]
}

export function sortRemarksByDateDesc(remarks = []) {
  return [...remarks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function removeCounselorRemark(remarks = [], remarkId) {
  return remarks.filter((r) => r.id !== remarkId)
}

export function isCounselorAssigned(row) {
  if (row?.isAssigned === true) return true
  return Boolean(row?.counselorName || row?.assignedCounselorName)
}
