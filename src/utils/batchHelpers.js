import { INITIAL_BATCHES } from '../data/batchManagementData'
import { formatBatchSubjectDropdownLabel } from './facultySubjectBatch'
import { DEFAULT_BATCH_CAPACITY } from './batchOperations'
import { resolveMentorDisplayName } from './mentorEmployees'

export function nextBatchId(rows = []) {
  const max = rows.reduce((m, row) => {
    const raw = row.batchId || ''
    const num = parseInt(String(raw).replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `BAT${String(max + 1).padStart(3, '0')}`
}

export function nextCourseId(rows = []) {
  const max = rows.reduce((m, row) => {
    const raw = row.courseId || row.formData?.courseId || ''
    const num = parseInt(String(raw).replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `CRS${String(max + 1).padStart(3, '0')}`
}

export function normalizeLinkedSubjects(form = {}) {
  let list = []
  if (Array.isArray(form.linkedSubjects) && form.linkedSubjects.length) {
    list = form.linkedSubjects.filter((s) => s?.subjectId)
  } else {
    const legacy = (form.subjects || []).filter(Boolean)
    list = legacy.map((s) => {
      if (typeof s === 'object' && s.subjectId) return s
      return { subjectId: String(s), subjectName: String(s) }
    })
  }
  const seen = new Set()
  return list
    .map((s) => ({
      subjectId: String(s.subjectId),
      subjectName: String(s.subjectName || '').trim(),
      facultyId: String(s.facultyId || '').trim(),
      facultyName: String(s.facultyName || '').trim(),
    }))
    .filter((s) => {
      if (seen.has(s.subjectId)) return false
      seen.add(s.subjectId)
      return true
    })
}

export function enrichBatchRow(row, index = 0) {
  const fd = row.formData || {}
  return {
    ...row,
    batchId: row.batchId || fd.batchId || `BAT${String(index + 1).padStart(3, '0')}`,
    batchName: row.batchName || fd.batchName || row.name || '',
    courseId: row.courseId || fd.courseId || '—',
    courseName: row.courseName || row.linkedCourseName || fd.courseName,
    linkedCourseName: row.linkedCourseName || row.courseName || fd.courseName,
    commencement: row.commencement || fd.commencement || '',
    durationLabel: row.durationLabel || fd.durationLabel || fd.duration || '',
    batchStartFrom: row.batchStartFrom || fd.batchStartFrom || '',
    batchEndTo: row.batchEndTo || fd.batchEndTo || '',
    bannerPreview: row.bannerPreview || fd.bannerPreview || fd.bannerUrl || '',
    bannerFileName: row.bannerFileName || fd.bannerFileName || '',
    createdAt: row.createdAt || fd.createdAt,
    modifiedAt: row.modifiedAt || fd.modifiedAt,
    capacity: row.capacity ?? fd.capacity ?? DEFAULT_BATCH_CAPACITY,
    mergedInto: row.mergedInto ?? fd.mergedInto ?? null,
    mergedIntoName: row.mergedIntoName ?? fd.mergedIntoName ?? null,
  }
}

/** Demo batches → enriched rows when API returns nothing (local dev / offline). */
export function mapInitialBatchesToRows() {
  return INITIAL_BATCHES.map((b, i) =>
    enrichBatchRow(
      {
        id: b.id,
        batchId: b.batchId,
        batchName: b.batchLabel,
        linkedCourseName: b.courseName,
        name: b.displayName,
        status: b.status,
        batchStartFrom: b.startDate,
        batchEndTo: b.endDate,
        formData: { trainerName: b.trainerName },
      },
      i,
    ),
  )
}

/** Maps API/enriched batch row + local students into the batch management table shape. */
export function mapBatchRowToTableFormat(row, students = [], totalStudentsOverride) {
  const fd = row.formData || {}
  const courseName = row.linkedCourseName || row.program || 'Course'
  const batchLabel = row.batchName || row.name || 'Batch'
  const totalStudents =
    totalStudentsOverride != null ? totalStudentsOverride : students.length
  return {
    id: row.id,
    batchId: row.batchId || fd.batchId || '—',
    courseName,
    batchLabel,
    displayName: `${courseName} - ${batchLabel}`,
    trainerName: resolveMentorDisplayName(row),
    startDate: row.batchStartFrom || row.commencement || fd.batchStartFrom || '',
    endDate: row.batchEndTo || fd.batchEndTo || '',
    status: row.status || 'Active',
    capacity: row.capacity ?? fd.capacity ?? DEFAULT_BATCH_CAPACITY,
    mergedInto: row.mergedInto ?? fd.mergedInto ?? null,
    mergedIntoName: row.mergedIntoName ?? fd.mergedIntoName ?? null,
    students,
    totalStudents,
    apiRow: row,
  }
}

export function formatLinkedSubjectDisplay(link) {
  if (!link) return ''
  return formatBatchSubjectDropdownLabel({
    subjectId: link.subjectId,
    subjectName: link.subjectName,
    facultyName: link.facultyName,
  })
}
